import express from 'express';
import {
    checkInHabit,
    createHabit,
    deleteHabit,
    getHabitAnalytics,
    getHabitStats,
    getHabits,
    removeHabitCheckIn,
    updateHabit
} from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getHabits)
    .post(protect, createHabit);

router.get('/stats', protect, getHabitStats);
router.get('/analytics', protect, getHabitAnalytics);

router.route('/:id/checkin')
    .post(protect, checkInHabit)
    .delete(protect, removeHabitCheckIn);

router.route('/:id')
    .put(protect, updateHabit)
    .delete(protect, deleteHabit)


export default router;
