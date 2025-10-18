import express from 'express';
import { subscribe, sendNewsletter, getSubscribers,deleteSubscriber} from '../controllers/newsletterController.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/send-newsletter', sendNewsletter);
router.get('/subscribers', getSubscribers);

router.delete('/delete', deleteSubscriber);

export default router;