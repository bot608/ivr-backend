import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const lookupNumber = async (req, res) => {
  const { phone, user_Id } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // Step 1: Check if phone exists in Contact table for the user
    const existingContact = await prisma.contact.findFirst({
      where: {
        phone,
        userId: user_Id,
      },
    });

    if (existingContact) {
      return res.status(200).json({
        source: "contact",
        data: existingContact,
      });
    }

    const existingLookup = await prisma.callerLookup.findFirst({
      where: {
        phone,
        user_Id,
      },
    });

    if (existingLookup) {
      return res.status(200).json({
        source: "lookup_cache",
        data: existingLookup,
      });
    }
    const response = await client.lookups.v2
      .phoneNumbers(phone)
      .fetch({ fields: ["caller_name", "line_type_intelligence"] });

    console.log("Twilio Lookup response:", response);

    const data = {
      phone: response.phoneNumber,
      callerName: response.callerName?.caller_name || "Unknown",
      callerType: response.callerName?.caller_type || "Unknown",
      lineType: response.lineTypeIntelligence?.type || "Unknown",
      lineCategory: response.lineTypeIntelligence?.category || "Unknown",
      user_Id: user_Id || null,
    };

    // Step 4: Save to callerLookup table
    const saved = await prisma.callerLookup.create({ data });

    res.status(200).json({
      source: "twilio",
      data: saved,
    });
  } catch (error) {
    console.error("Lookup error:", error.message);
    res.status(500).json({
      error: "Failed to lookup number",
      details: error.message,
    });
  }
};


export const recordCallResult = async (req, res) => {
  const { phone, callTime, answered } = req.body;

  if (!phone || typeof answered === "undefined" || !callTime) {
    return res
      .status(400)
      .json({ error: "phone, callTime, and answered fields are required" });
  }

  try {
    const updated = await prisma.callerLookup.updateMany({
      where: { phone },
      data: {
        callTime: new Date(callTime),
        answered: answered === true || answered === "true",
      },
    });

    if (updated.count === 0) {
      return res
        .status(404)
        .json({ error: "No matching phone number found to update" });
    }

    res
      .status(200)
      .json({ message: "Call result recorded successfully", updated });
  } catch (error) {
    console.error("Call result error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to record call result", details: error.message });
  }
};

export const getCallsByUserId = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const calls = await prisma.callerLookup.findMany({
      where: { user_Id: userId },
      orderBy: { callTime: "desc" },
    });

    if (!calls.length) {
      return res
        .status(404)
        .json({ message: "No call records found for this user" });
    }

    res.status(200).json({ calls });
  } catch (error) {
    console.error("Error fetching call details:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch call details", details: error.message });
  }
};

export const toggleIvr = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "CallerLookup ID is required" });
  }

  try {
    const caller = await prisma.callerLookup.findUnique({
      where:{id: id},
    });

    if (!caller) {
      return res
        .status(404)
        .json({ success: false, message: "CallerLookup not found" });
    }

    const updatedCaller = await prisma.callerLookup.update({
      where: { id: id },
      data: {
        enableIVR: !caller.enableIVR,
      },
    });

    res.json({
      success: true,
      message: `enableIVR is now ${updatedCaller.enableIVR}`,
      data: updatedCaller,
    });
  } catch (error) {
    console.error("Error toggling enableIVR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateCallerLookup = async (req, res) => {
  const { id, ...updateFields } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "CallerLookup ID is required" });
  }

  if (Object.keys(updateFields).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No fields provided to update" });
  }

  try {
    const caller = await prisma.callerLookup.findUnique({
      where: { id },
    });

    if (!caller) {
      return res
        .status(404)
        .json({ success: false, message: "CallerLookup not found" });
    }

    const updatedCaller = await prisma.callerLookup.update({
      where: { id },
      data: updateFields,
    });

    res.json({
      success: true,
      message: "CallerLookup updated successfully",
      data: updatedCaller,
    });
  } catch (error) {
    console.error("Error updating CallerLookup:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
