import DailyUserStat from '../models/DailyUserStat.js';
import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import { startOfUtcDay } from './dateUtils.js';

const eachUtcDay = (startDate, endDate) => {
    const days = [];
    const cursor = startOfUtcDay(startDate);
    const end = startOfUtcDay(endDate);

    while (cursor.getTime() <= end.getTime()) {
        days.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
};

export const refreshDailyStatsForRange = async (userId, startDate, endDate) => {
    const start = startOfUtcDay(startDate);
    const end = startOfUtcDay(endDate);
    const habits = await Habit.find({
        user: userId,
        status: { $ne: 'archived' }
    }).select('_id').lean();
    const habitIds = habits.map((habit) => habit._id);
    const totalHabits = habits.length;

    const completions = habitIds.length > 0
        ? await HabitCompletion.aggregate([
            {
                $match: {
                    user: userId,
                    habit: { $in: habitIds },
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$date',
                    completed: { $sum: 1 }
                }
            }
        ])
        : [];

    const completionsByDate = completions.reduce((map, item) => {
        map.set(startOfUtcDay(item._id).toISOString(), item.completed);
        return map;
    }, new Map());

    const operations = eachUtcDay(start, end).map((date) => {
        const completed = completionsByDate.get(date.toISOString()) || 0;
        const completionRate = totalHabits > 0
            ? Math.round((completed / totalHabits) * 100)
            : 0;

        return {
            updateOne: {
                filter: { user: userId, date },
                update: {
                    $set: {
                        totalHabits,
                        completed,
                        completionRate
                    }
                },
                upsert: true
            }
        };
    });

    if (operations.length === 0) return [];

    await DailyUserStat.bulkWrite(operations, { ordered: false });

    return DailyUserStat.find({
        user: userId,
        date: { $gte: start, $lte: end }
    }).sort({ date: 1 }).lean();
};

export const refreshDailyStat = async (userId, date = new Date()) => {
    const [stat] = await refreshDailyStatsForRange(userId, date, date);

    return stat;
};
