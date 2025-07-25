import express from "express";
import { downloadWeeklyReportPDF, getCallDetails, getIVRSettingsByUserId, getWeeklyReport, handleIncomingCall, setForwardingNumber, updateIVRSettings } from "../controllers/callController.js";

const router = express.Router();

// API to update forwarding number
router.post('/set-forwarding-number', setForwardingNumber);

// Twilio webhook for incoming calls
router.post('/voice', handleIncomingCall);

router.get('/call-details', getCallDetails);
router.post('/update-ivr-settings', updateIVRSettings);
router.get('/weekly-report', getWeeklyReport);
router.get('/weekly-report/download', downloadWeeklyReportPDF);
router.get('/ivr-settings/:userId', getIVRSettingsByUserId);
export default router;

