// src/utils/otp.js

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiryTime() {
  return new Date(Date.now() + 5 * 60 * 1000);
}
