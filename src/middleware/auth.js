import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import redis from "../config/redis.js";

const auth = async (req) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token generated before sessionId support
    if (!decoded.sessionId) {
      return null;
    }

    const session = await redis.get(`astro:session:${decoded.id}`);

    if (!session) {
      return null;
    }

    const { sessionId } = JSON.parse(session);

    if (sessionId !== decoded.sessionId) {
      return null;
    }

    const user = await prisma.astrologer.findUnique({
      where: {
        id: decoded.id,
      },
    });

    return user;
  } catch (err) {
    return null;
  }
};

export default auth;