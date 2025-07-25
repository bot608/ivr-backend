import express from "express";
import { getAllPhoneReports, getPhoneReportByUserAndPhone, reportPhoneNumber } from "../controllers/reportNumberController.js";

const router = express.Router();

router.post("/report-phone-number", reportPhoneNumber);
router.get("/all-reports", getAllPhoneReports);
router.get("/get-report", getPhoneReportByUserAndPhone);

export default router;

