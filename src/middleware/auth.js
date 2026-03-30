import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const auth = async (req) => {
  try {
    const authHeader = req?.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null; // ❌ no res.status here
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 fetch full user (recommended)
    const user = await prisma.astrologer.findUnique({
      where: { id: decoded.id },
    });

    return user;
  } catch (err) {
    return null; // ❌ never throw / never use res
  }
};

export default auth;