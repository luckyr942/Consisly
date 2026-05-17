import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import User from '../models/User.js';
import { daysBetweenInclusive, weeksBetweenInclusive } from './dateUtils.js';
import { syncLegacyCompletionsForUser } from './syncLegacyCompletions.js';

const getExpectedCompletions = (habit) => {
    if (habit.frequency === 'weekly') {
        return weeksBetweenInclusive(habit.createdAt);
    }

    return daysBetweenInclusive(habit.createdAt);
};

export const recalculateConsistencyScore = async (userId) => {
    await syncLegacyCompletionsForUser(userId);

    const habits = await Habit.find({ user: userId, status: { $ne: 'archived' } });

    if (habits.length === 0) {
        await User.findByIdAndUpdate(userId, { consistencyScore: 0 });
        return 0;
    }

    const totalExpected = habits.reduce((sum, habit) => {
        return sum + getExpectedCompletions(habit);
    }, 0);

    const totalCompleted = await HabitCompletion.countDocuments({
        user: userId,
        habit: { $in: habits.map((habit) => habit._id) }
    });

    const score = Math.min(Math.round((totalCompleted / totalExpected) * 100), 100);

    await User.findByIdAndUpdate(userId, { consistencyScore: score });

    return score;
};
