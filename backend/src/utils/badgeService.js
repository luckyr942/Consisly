import Badge from '../models/badge.js';
import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import { startOfUtcDay } from './dateUtils.js';
import { syncLegacyCompletionsForUser } from './syncLegacyCompletions.js';

const BADGES = {
    FIRST_HABIT: {
        title: 'First Habit',
        description: 'Created your first habit.'
    },
    FIRST_COMPLETION: {
        title: 'First Completion',
        description: 'Completed your first habit.'
    },
    THREE_COMPLETIONS: {
        title: '3 Completions',
        description: 'Completed habits 3 times.'
    },
    SEVEN_COMPLETIONS: {
        title: '7 Completions',
        description: 'Completed habits 7 times.'
    },
    THREE_HABITS: {
        title: 'Habit Builder',
        description: 'Created 3 habits.'
    },
    PERFECT_TODAY: {
        title: 'Perfect Today',
        description: 'Completed all habits for today.'
    }
};

const unlockBadge = async (userId, badgeKey) => {
    const badge = BADGES[badgeKey];

    if (!badge) return null;

    const existingBadge = await Badge.findOne({
        user: userId,
        badgeKey
    });

    if (existingBadge) return null;

    return Badge.create({
        user: userId,
        badgeKey,
        title: badge.title,
        description: badge.description
    });
};

export const checkAndUnlockBadges = async (userId) => {
    await syncLegacyCompletionsForUser(userId);

    const habits = await Habit.find({ user: userId, status: { $ne: 'archived' } });
    const today = startOfUtcDay(new Date());

    const totalHabits = habits.length;
    const habitIds = habits.map((habit) => habit._id);

    const totalCompletions = await HabitCompletion.countDocuments({
        user: userId,
        habit: { $in: habitIds }
    });

    const completedToday = await HabitCompletion.countDocuments({
        user: userId,
        habit: { $in: habitIds },
        date: today
    });

    const unlockedBadges = [];

    if (totalHabits >= 1) {
        const badge = await unlockBadge(userId, 'FIRST_HABIT');
        if (badge) unlockedBadges.push(badge);
    }

    if (totalHabits >= 3) {
        const badge = await unlockBadge(userId, 'THREE_HABITS');
        if (badge) unlockedBadges.push(badge);
    }

    if (totalCompletions >= 1) {
        const badge = await unlockBadge(userId, 'FIRST_COMPLETION');
        if (badge) unlockedBadges.push(badge);
    }

    if (totalCompletions >= 3) {
        const badge = await unlockBadge(userId, 'THREE_COMPLETIONS');
        if (badge) unlockedBadges.push(badge);
    }

    if (totalCompletions >= 7) {
        const badge = await unlockBadge(userId, 'SEVEN_COMPLETIONS');
        if (badge) unlockedBadges.push(badge);
    }

    if (totalHabits > 0 && completedToday === totalHabits) {
        const badge = await unlockBadge(userId, 'PERFECT_TODAY');
        if (badge) unlockedBadges.push(badge);
    }

    return unlockedBadges;
};
