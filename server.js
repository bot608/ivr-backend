import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
const serviceAccount = JSON.parse(
  fs.readFileSync(
    new URL("./src/config/serviceAccountKey.json", import.meta.url)
  )
);
import authRoutes from "./src/routes/authRoutes.js";
import lookupRoutes from "./src/routes/lookupRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import callRoutes from "./src/routes/callRoutes.js";
import reportPhoneRoutes from "./src/routes/reportPhoneRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const prisma = new PrismaClient();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use("/api/auth", authRoutes);
app.use("/api", lookupRoutes);
app.use("/api", callRoutes);
app.use("/api", contactRoutes);
app.use("/api", reportPhoneRoutes);
app.use("/api", notificationRoutes);

const PORT = process.env.PORT || 5000;

// Database connection check
prisma.$connect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
  });

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
