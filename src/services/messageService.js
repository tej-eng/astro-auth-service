import prisma from "../config/prisma.js";
import redis from "../config/redis.js";
import { generateOtp } from "../utils/otp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../config/jwt.js";

const OTP_EXPIRE = 300;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW = 600;
const LOGIN_FAIL_LIMIT = 5;
const LOGIN_FAIL_WINDOW = 900;

const REFRESH_COOKIE_NAME = "astro_refresh_token";
const REFRESH_EXPIRE_DAYS = 7;

// ================= REGISTER =================
export const getChatMessages = async (roomId) => {
  const key = `chat_messages:${roomId}`;

  const messages = await redis.lrange(key, 0, -1);

  return {
    success: true,
    totalCount: messages.length,
    data: messages.map((item) => {
      const msg = JSON.parse(item);

      return {
        id: msg.msg_id,
        msgId: msg.msg_id,
        roomId: msg.room_id,
        senderId: msg.sender_id,
        receiverId: msg.received_id,
        message: msg.message,
        image: msg.image,
        sender: msg.sender,
        replyTo: msg.replyTo
          ? JSON.stringify(msg.replyTo)
          : null,
        createdAt: msg.time,
      };
    }),
  };
};






