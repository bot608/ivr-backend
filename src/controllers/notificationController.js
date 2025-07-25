import { PrismaClient } from "@prisma/client";
import admin from "firebase-admin";

const prisma = new PrismaClient();

export const sendNotification = async (req, res) => {
  const { userId, title = "New Notification", description = "", image = "" } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.fcmToken) {
      await prisma.notificationLog.create({
        data: {
          userId,
          phone: user?.phone || "Unknown",
          fcmToken: "",
          status: "failed",
          error: "FCM token not found",
        },
      });

      return res.status(404).json({
        success: false,
        message: "User not found or FCM token missing",
      });
    }

    const payload = {
      notification: {
        title,
        body: description,
        image,
      },
      token: user.fcmToken,
    };

    try {
      const firebaseResponse = await admin.messaging().send(payload);

      await prisma.notificationLog.create({
        data: {
          userId,
          phone: user.phone,
          fcmToken: user.fcmToken,
          status: "sent",
        },
      });

      return res.json({
        success: true,
        message: "Notification sent successfully",
        firebaseResponse,
      });

    } catch (fcmError) {
      await prisma.notificationLog.create({
        data: {
          userId,
          phone: user.phone,
          fcmToken: user.fcmToken,
          status: "failed",
          error: fcmError.message,
        },
      });

      return res.status(500).json({
        success: false,
        message: "Notification sending failed",
        error: fcmError.message,
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
