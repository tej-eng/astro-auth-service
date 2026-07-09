import prisma from "../config/prisma.js";
import redis from "../config/redis.js";
import { generateOtp } from "../utils/otp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../config/jwt.js";



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






