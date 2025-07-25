import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";

import nodemailer from "nodemailer";
import { sendOTPEmail } from "../config/nodemailer.config.js";

const prisma = new PrismaClient();
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate 6-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Create JWT tokens
const createTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );

  return { accessToken, refreshToken };
};

export const registerUser = async ({ username, email, phone, password }) => {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }, { phone }] },
  });

  if (existingUser)
    throw new Error("Username, email, or phone already exists.");

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  // First, try sending the OTP email
  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new Error("Failed to send OTP email. Please try again.");
  }

  // If email sent successfully, then store user data
  const user = await prisma.user.create({
    data: {
      username,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
    },
  });

  return {
    message: "OTP sent to your email.",
    phone: user.phone,
  };
};

export const verifyOTP = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otp || !user.otpExpires)
    throw new Error("Invalid or expired OTP.");
  if (new Date() > user.otpExpires)
    throw new Error("OTP expired. Please register again.");
  if (user.otp !== otp) throw new Error("Incorrect OTP.");

  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  });

  const { accessToken, refreshToken } = createTokens(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    message: "User verified & registered successfully.",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
    },
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found.");
  if (!user.isVerified) throw new Error("User not verified.");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid password.");

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otpExpires },
  });

  // await client.messages.create({
  //   body: `Your login OTP is ${otp}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: user.phone,
  // });

  await sendOTPEmail(email, otp);
  return {
    message: "OTP sent to your phone for login verification.",
    phone: user.phone,
  };
};

export const refreshSession = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Invalid refresh token.");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) throw new Error("Invalid session.");

  const { accessToken } = createTokens(user.id);
  return { accessToken };
};

export const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user||!user.isVerified) throw new Error("User not found or not verified.");

  return {
    message: "Email found. Proceed to reset password.",
    email,
  };
};

export const resetPassword = async ({ email, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("User not found.");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otp,
      otpExpires,
    },
  });

  await sendOTPEmail(email, otp);

  return {
    message: "Password reset. OTP sent to email for verification.",
  };
};

export const resendOTP = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.isVerified) {
    throw new Error("User is already verified.");
  }

  const now = new Date();


  // if (user.otpExpires && now < new Date(user.otpExpires.getTime() - 4 * 60 * 1000)) {
  //   throw new Error("Please wait before requesting a new OTP.");
  // }

  const otp = generateOTP();
  const otpExpires = new Date(now.getTime() + 5 * 60 * 1000);

  try {
    await sendOTPEmail(email, otp);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpires },
    });

    return {
      message: "A new OTP has been sent to your email.",
    };
  } catch (error) {
    console.error("Resend OTP email error:", error);
    throw new Error("Failed to resend OTP. Please try again later.");
  }
};
