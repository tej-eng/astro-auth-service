// src/config/jwt.js

import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      sessionId: user.sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1m",
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      sessionId: user.sessionId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);