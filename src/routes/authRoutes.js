import express from "express";
import {
  registerUser,
  loginUser,
  verifyOTP,
  refreshToken,
  forgotPassword,
  resetPassword,
  resendOTP,
  activeUser,
  updateFcmToken
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend", resendOTP);
router.post("/active", activeUser);
router.put('/update-fcm-token', updateFcmToken);
export default router;
