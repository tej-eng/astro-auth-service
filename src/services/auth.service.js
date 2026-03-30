import prisma from "../config/prisma.js";
import redis from "../config/redis.js";
import { generateOtp } from "../utils/otp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";

const OTP_EXPIRE = 300;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW = 600;
const LOGIN_FAIL_LIMIT = 5;
const LOGIN_FAIL_WINDOW = 900;

const REFRESH_COOKIE_NAME = "astro_refresh_token";
const REFRESH_EXPIRE_DAYS = 7;

// ================= REGISTER =================
export const registerAstrologerService = async (data) => {
  const exists = await prisma.astrologer.findFirst({
    where: { OR: [{ email: data.email }, { contactNo: data.contactNo }] },
  });

  if (exists) throw new Error("Astrologer already registered");

  if (!data.profilePic.match(/\.(jpg|jpeg|png)$/i)) {
    throw new Error("Invalid profile picture format");
  }

  return prisma.astrologer.create({
    data: {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      addresses: { create: data.addresses },
      experiences: { create: data.experiences },
    },
    include: { addresses: true, experiences: true },
  });
};

// ================= REQUEST OTP =================
export const requestOtpService = async (contactNo) => {
  const astrologer = await prisma.astrologer.findFirst({
    where: { contactNo },
  });

  if (!astrologer) throw new Error("Astrologer not found");
  if (astrologer.approvalStatus !== "APPROVED")
    throw new Error("Astrologer not approved");

  const rateKey = `otp_rate:${contactNo}`;
  const count = await redis.incr(rateKey);

  if (count === 1) await redis.expire(rateKey, OTP_RATE_WINDOW);
  if (count > OTP_RATE_LIMIT)
    throw new Error("Too many OTP requests. Try later.");

  const otp = generateOtp();

  await redis.set(`astrologer_otp:${contactNo}`, otp, "EX", OTP_EXPIRE);

  console.log("OTP:", otp);

 return {
  message: "OTP sent successfully",
};
};

// ================= VERIFY OTP =================
export const verifyOtpService = async (contactNo, otp, res) => {
  const storedOtp = await redis.get(`astrologer_otp:${contactNo}`);

  if (!storedOtp || storedOtp !== otp) {
    const failKey = `login_fail:${contactNo}`;
    const fails = await redis.incr(failKey);

    if (fails === 1) await redis.expire(failKey, LOGIN_FAIL_WINDOW);
    if (fails > LOGIN_FAIL_LIMIT)
      throw new Error("Too many failed attempts.");

    throw new Error("Invalid OTP");
  }

  await redis.del(`astrologer_otp:${contactNo}`);
  await redis.del(`login_fail:${contactNo}`);

  const astrologer = await prisma.astrologer.findFirst({
    where: { contactNo },
  });

  if (!astrologer) throw new Error("Astrologer not found");

  const payload = { id: astrologer.id, role: "ASTROLOGER" };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.astrologer.update({
    where: { id: astrologer.id },
    data: { refreshToken },
  });

  await redis.set(
    `refresh:${astrologer.id}`,
    refreshToken,
    "EX",
    REFRESH_EXPIRE_DAYS * 24 * 60 * 60
  );

  // ✅ Safe cookie set (important for tests)
  if (res) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  return { accessToken, astrologer };
};

// ================= REFRESH =================
export const refreshTokenService = async (req, res) => {
  if (!req || !req.cookies)
    throw new Error("Request context missing");

  const token = req.cookies[REFRESH_COOKIE_NAME];

  if (!token) throw new Error("Refresh token missing");

  const decoded = verifyRefreshToken(token);

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: decoded.id },
  });

  if (!astrologer || astrologer.refreshToken !== token)
    throw new Error("Refresh token mismatch");

  const newAccessToken = generateAccessToken({
    id: astrologer.id,
    role: "ASTROLOGER",
  });

  const newRefreshToken = generateRefreshToken({
    id: astrologer.id,
    role: "ASTROLOGER",
  });

  await prisma.astrologer.update({
    where: { id: astrologer.id },
    data: { refreshToken: newRefreshToken },
  });

  await redis.set(
    `refresh:${astrologer.id}`,
    newRefreshToken,
    "EX",
    REFRESH_EXPIRE_DAYS * 24 * 60 * 60
  );

  if (res) {
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  return { accessToken: newAccessToken };
};

// ================= LOGOUT =================
export const logoutService = async (req, res) => {
  if (!req || !req.cookies)
    throw new Error("Request context missing");

  const token = req.cookies[REFRESH_COOKIE_NAME];

  if (!token) return "Already logged out";

  let decoded;

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new Error("Invalid refresh token");
  }

  await prisma.astrologer.update({
    where: { id: decoded.id },
    data: { refreshToken: null },
  });

  await redis.del(`refresh:${decoded.id}`);

  if (res) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return "Logged out successfully";
};
