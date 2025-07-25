import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const singleContact = async (req, res) => {
  const { userId, name, phone, email, address, transcription } = req.body;

  if (!userId || !name || !phone) {
    return res.status(400).json({
      status: false,
      message: "userId, name, and phone are required",
    });
  }

  try {
    const newContact = await prisma.contact.create({
      data: {
        userId: String(userId),
        name,
        phone,
        email,
        address,
        transcription,
      },
    });

    res.json({
      status: true,
      message: "Contact added successfully",
      data: newContact,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to add contact",
      error: error.message,
    });
  }
};
export const multipleContact = async (req, res) => {
  const { userId, contacts } = req.body;

  if (!userId || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      status: false,
      message: "userId and contacts array are required",
    });
  }

  try {
    const contactData = contacts.map((contact) => ({
      userId: String(userId),
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      address: contact.address || null,
      transcription: contact.transcription || null,
    }));

    await prisma.contact.createMany({
      data: contactData,
    });

    res.json({
      status: true,
      message: "Contacts added successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to add contacts",
      error: error.message,
    });
  }
};

export const blockContact = async (req, res) => {
  const { userId, phone, block } = req.body;

  if (!userId || !phone || typeof block !== "boolean") {
    return res.status(400).json({
      status: false,
      message: "userId, phone, and block (true/false) are required",
    });
  }

  try {
    const contact = await prisma.contact.findFirst({
      where: {
        userId,
        phone,
      },
    });

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: "Contact not found for this user",
      });
    }

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: { block },
    });

    return res.status(200).json({
      status: true,
      message: `Contact has been ${
        block ? "blocked" : "unblocked"
      } successfully`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getBlockedContacts = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      status: false,
      message: "userId is required",
    });
  }

  try {
    const blockedContacts = await prisma.contact.findMany({
      where: {
        userId,
        block: true,
      },
    });
    if (blockedContacts.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Blocked contacts fetched successfully",
        data: blockedContacts,
      });
    }else{
      return res.json({
        status: false,
        message: "No Blocked contacts found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllContactsByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      status: false,
      message: "userId is required",
    });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: {
        userId: String(userId),
      },
    });

    res.json({
      status: true,
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};
