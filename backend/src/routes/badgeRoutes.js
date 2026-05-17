import express from 'express';
import { getMyBadges } from '../controllers/badgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyBadges);

export default router;
