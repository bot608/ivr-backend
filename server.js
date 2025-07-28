import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import fs from "fs";
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

