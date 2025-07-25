import express from 'express';
import { getCallsByUserId, lookupNumber, recordCallResult ,toggleIvr, updateCallerLookup} from '../controllers/lookupController.js';



const router = express.Router();

router.post('/lookup', lookupNumber);
router.post('/record-call', recordCallResult)
router.get('/calls', getCallsByUserId);
router.put('/toggle-ivr',toggleIvr)
router.put("/update", updateCallerLookup);
export default router;
