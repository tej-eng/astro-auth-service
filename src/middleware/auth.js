import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import redis from "../config/redis.js";

const auth = async (req) => {
  try {
   const token =
  req.cookies?.accessToken ||
  req.headers?.authorization?.replace("Bearer ", "");

console.log("TOKEN:", token);

const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log("DECODED:", decoded);

const session = await redis.get(`astro:session:${decoded.id}`);
console.log("REDIS SESSION:", session);

if (session) {
  console.log("PARSED:", JSON.parse(session));
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
  console.error("AUTH ERROR:", err.message);
  return null;
}
};

export default auth;