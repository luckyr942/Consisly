import Badge from "../src/models/badge";
import Habit from "../src/models/Habit";
import { isSameUtcDay, startOfUtcDay } from "../src/utils/dateUtils";

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

const unlockBadge = async(userId, badgeKey) =>{
    const badge = BADGES[badgeKey];

    if(!badge) return null;

    const existingBadge = await Badge.findOne({
        user: userId,
        badgeKey
    });

    if(!existingBadge) return null;
    
    return Badge.create({
        user: userId,
        badgeKey,
        title:badge.title,
        description:badge.description
    });
};

export const checkAndUnlockBadges = async(userId) =>{
    const habits = await Habit.find({ user: userId});
    const today = startOfUtcDay
}