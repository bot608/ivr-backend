import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const reportPhoneNumber = async (req, res) => {
  const { userId, phone, content } = req.body;

  if (!userId || !phone || !content) {
    return res.status(400).json({
      status: false,
      message: "userId, phone, and content are required",
    });
  }

  try {
    const reporter = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!reporter) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const report = await prisma.phoneNumberReport.create({
      data: {
        userId,
        phone,
        content,
      },
    });

    if (reporter.fcmToken) {
      const payload = {
        notification: {
          title: `${reporter.phone} is send a voice mail`,
          body: `${content}`,
        },
        data: {
          reporterId: reporter.id,
          reporterPhone: reporter.phone,
          reportedPhone: phone,
          reportContent: content,
        },
        token: reporter.fcmToken,
      };

      await admin.messaging().send(payload);
      console.log("📤 Notification sent.");
    }

    return res.status(201).json({
      status: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error in reportPhoneNumber:", error.message);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllPhoneReports = async (req, res) => {
  try {
    const reports = await prisma.phoneNumberReport.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      status: true,
      message: "All phone number reports fetched successfully",
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPhoneReportByUserAndPhone = async (req, res) => {
  const { userId, phone } = req.body;

  if (!userId || !phone) {
    return res.status(400).json({
      status: false,
      message: "userId and phone are required",
    });
  }

  try {
    const reports = await prisma.phoneNumberReport.findMany({
      where: {
        userId,
        phone,
      },
      orderBy: { createdAt: "desc" },
    });

    if (reports.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No reports found for this user and phone number",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Reports fetched successfully",
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
