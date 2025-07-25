// routes/contactRoutes.js
import express from "express";
import { blockContact, getAllContactsByUserId, getBlockedContacts, multipleContact, singleContact } from "../controllers/contactController.js";
const router = express.Router();


router.post('/singleContact',singleContact );
router.post('/multipleContact',multipleContact );
router.post('/blockContact',blockContact );
router.get('/blocked-contacts', getBlockedContacts);
router.get("/contacts/:userId", getAllContactsByUserId);

export default router;
