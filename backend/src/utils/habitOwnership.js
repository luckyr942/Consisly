import mongoose from 'mongoose';
import Habit from '../models/Habit.js';

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const findHabitForUser = async (habitId, userId) => {
    if (!isValidObjectId(habitId)) return null;

    return Habit.findOne({
        _id: habitId,
        user: userId
    });
};
