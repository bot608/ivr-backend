import { PrismaClient } from "@prisma/client";
import * as authService from "../services/authService.js";
const prisma = new PrismaClient();
export const registerUser = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const result = await authService.registerUser({
      username,
      email,
      phone,
      password,
    });
    res.status(200).json({ message: "User registered. OTP sent.", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res
      .status(200)
      .json({ message: "OTP sent to registered phone number.", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tokens = await authService.verifyOTP({ email, otp });
    res.status(200).json(tokens);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    const newToken = await authService.refreshSession(token);
    res.status(200).json(newToken);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword({ email });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const result = await authService.resetPassword({ email, newPassword });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOTP({ email });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const activeUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId is required" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });

    res.json({
      success: true,
      message: "User activity time updated",
      lastActive: updatedUser.lastActive,
    });
  } catch (error) {
    console.error("Error updating lastActive:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateFcmToken = async (req, res) => {
  const { userId, fcmToken } = req.body;

  if (!userId || !fcmToken) {
    return res.status(400).json({
      success: false,
      message: 'userId and fcmToken are required',
    });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return res.status(200).json({
      success: true,
      message: 'FCM Token updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};