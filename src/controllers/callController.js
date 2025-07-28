
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import twilio from 'twilio';
import PDFDocument from 'pdfkit';
const VoiceResponse = twilio.twiml.VoiceResponse;
import cron from 'node-cron';

let forwardToNumber = ''; 

export const setForwardingNumber = (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: 'Number is required' });
  }

  forwardToNumber = number;
  console.log(`Forwarding number updated to: ${number}`);
  res.json({ message: 'Forwarding number set successfully' });
};

export const handleIncomingCall = async (req, res) => {
  const twiml = new VoiceResponse();
  const phone = req.query.phone;

  const user = await prisma.callerLookup.findFirst({ where: { phone } });

  if (!user || !user.enableIVR) {
    twiml.say('IVR is currently disabled or user not found.');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  const isBlocked = user.blockedCalls === true;
  const isUnknown = !user.callerName || user.callerName === "Unknown";

  if ((isBlocked || isUnknown) && user.user_Id) {
    const userInfo = await prisma.user.findUnique({
      where: { id: user.user_Id },
    });

    if (userInfo?.fcmToken) {
      let title = "📞 Incoming Call";
      let body = `Caller: ${phone} tried to reach you.`;

      if (isBlocked) {
        title = "🚫 Blocked Caller Attempted";
        body = `Blocked caller ${phone} tried calling you.`;
      } else if (isUnknown) {
        title = "❓ Unknown Caller";
        body = `Unknown number ${phone} is trying to reach you.`;
      }

      const payload = {
        notification: {
          title,
          body,
        },
        data: {
          phone,
          type: isBlocked ? "blocked" : "unknown",
        },
        token: userInfo.fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        console.log("FCM Notification sent to user.");
      } catch (error) {
        console.error("Error sending FCM notification:", error.message);
      }
    }
  }

  const message =
    user.ivrMessage ||
    'Thank you for calling. To block commercial calls, press 1. To leave a message for the user, press 2. For emergencies, press 3.';

  twiml.say(message);

  if (user.forwardToNumber) {
    twiml.say('Forwarding your call, please wait.');
    twiml.dial(user.forwardToNumber);
  }

  res.type('text/xml');
  res.send(twiml.toString());
};


export const getCallDetails = async (req, res) => {
  const { userId, phone } = req.body;

  if (!userId || !phone) {
    return res.status(400).json({
      status: false,
      message: "userId and phone are required",

    });
  }

  try {
  const cleanedPhone = phone.trim();

  const callDetails = await prisma.callerLookup.findMany({
    where: {
      user_Id: userId,
      phone: cleanedPhone,
    },
  });
    if (callDetails.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No call details found for this user and phone number",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Call details fetched successfully",
      data: callDetails,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const updateIVRSettings = async (req, res) => {
  const {
    phone,
    enableIVR,
    blockedCalls,
    newMessages,
    weeklyReports,
    notificationSound,
    ivrBehavior,
    ivrMessage,
    forwardToNumber,
  } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const existing = await prisma.callerLookup.findFirst({ where: { phone } });

    if (!existing) {
      return res.status(404).json({ error: "Caller not found" });
    }

    await prisma.callerLookup.update({
      where: { id: existing.id },
      data: {
        enableIVR,
        blockedCalls,
        newMessages,
        weeklyReports,
        notificationSound,
        ivrBehavior,
        ivrMessage,
        forwardToNumber,
      },
    });

    res.json({ message: "IVR settings updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function calculateChange(current, previous) {
  if (previous === 0) {
    return {
      up: current > 0 ? '100%' : '0%',
      down: '0%'
    };
  }

  const diff = current - previous;
  const percent = Math.abs(Math.round((diff / previous) * 100));

  return {
    up: diff > 0 ? `${percent}%` : '0%',
    down: diff < 0 ? `${percent}%` : '0%'
  };
}


const getWeeklyReportData = async (userId) => {
  const now = new Date();
  const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfLastWeek = new Date(new Date(startOfThisWeek));
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

  const [thisWeekUnknown, lastWeekUnknown] = await Promise.all([
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        callerName: 'Unknown',
        callTime: { gte: startOfThisWeek },
      },
    }),
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        callerName: 'Unknown',
        callTime: { gte: startOfLastWeek, lte: endOfLastWeek },
      },
    }),
  ]);

  const [thisWeekBlocked, lastWeekBlocked] = await Promise.all([
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        enableIVR: true,
        blockedCalls: true,
        callTime: { gte: startOfThisWeek },
      },
    }),
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        enableIVR: true,
        blockedCalls: true,
        callTime: { gte: startOfLastWeek, lte: endOfLastWeek },
      },
    }),
  ]);

  const [thisWeekMessages, lastWeekMessages] = await Promise.all([
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        newMessages: true,
        callTime: { gte: startOfThisWeek },
      },
    }),
    prisma.callerLookup.count({
      where: {
        user_Id: userId,
        newMessages: true,
        callTime: { gte: startOfLastWeek, lte: endOfLastWeek },
      },
    }),
  ]);

  return {
    totalUnknownCalls: {
      count: thisWeekUnknown,
      ...calculateChange(thisWeekUnknown, lastWeekUnknown),
    },
    callBlocksAutomaticly: {
      count: thisWeekBlocked,
      ...calculateChange(thisWeekBlocked, lastWeekBlocked),
    },
    MessageReceived: {
      count: thisWeekMessages,
      ...calculateChange(thisWeekMessages, lastWeekMessages),
    }
  };
};

export const getWeeklyReport = async (req, res) => {
  const userId = req.query.user_Id;
  if (!userId) return res.status(400).json({ message: 'user_Id is required' });

  try {
    const result = await getWeeklyReportData(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const downloadWeeklyReportPDF = async (req, res) => {
  const userId = req.query.user_Id;
  if (!userId) return res.status(400).json({ message: 'user_Id is required' });

  try {
    const report = await getWeeklyReportData(userId);
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename="weekly-report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Weekly Report Summary', { align: 'center' }).moveDown();
    for (const [key, value] of Object.entries(report)) {
      doc
        .fontSize(14).text(`${key}:`, { underline: true })
        .fontSize(12).text(`Count: ${value.count}`)
        .text(`Up: ${value.up}`)
        .text(`Down: ${value.down}`)
        .moveDown();
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'PDF generation failed' });
  }
};

export const getIVRSettingsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const ivrSettings = await prisma.callerLookup.findFirst({
      where: { user_Id:userId },
      select: {
        phone: true,
        enableIVR: true,
        blockedCalls: true,
        newMessages: true,
        weeklyReports: true,
        notificationSound: true,
        ivrBehavior: true,
        ivrMessage: true,
        forwardToNumber: true,
      },
    });

    if (!ivrSettings) {
      return res.status(404).json({ error: "IVR settings not found for user" });
    }

    res.json(ivrSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


cron.schedule("0 10 * * 1", async () => {
  console.log("Weekly report cron job started...");

  try {
    const allUsers = await prisma.user.findMany({
      where: {
        fcmToken: {
          not: null,
        },
      },
    });

    for (const user of allUsers) {
      const data = await getWeeklyReportData(user.id);

      const message = `
📞 Weekly Call Report:
- 🚫 Blocked Calls: ${data.callBlocksAutomaticly.count}
- 🤷 Unknown Calls: ${data.totalUnknownCalls.count}
- 📩 New Messages: ${data.MessageReceived.count}
      `.trim();

      const payload = {
        notification: {
          title: "Your Weekly Call Report",
          body: message,
        },
        data: {
          type: "weekly_report",
          userId: user.id,
        },
        token: user.fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        console.log(`Report sent to ${user.username}`);
      } catch (err) {
        console.error(
          `Failed to send report to ${user.username}:`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error("Weekly report cron job failed:", err.message);
  }
});