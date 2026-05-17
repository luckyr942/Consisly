import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import { startOfUtcDay } from './dateUtils.js';

export const syncLegacyCompletionsForUser = async (userId) => {
    const habits = await Habit.find({
        user: userId,
        completedDates: { $exists: true, $ne: [] }
    }).select('_id completedDates');

    const operations = habits.flatMap((habit) => {
        const uniqueDates = new Map();

        habit.completedDates
            .map((date) => startOfUtcDay(date))
            .filter((date) => !Number.isNaN(date.getTime()))
            .forEach((date) => uniqueDates.set(date.toISOString(), date));

        return Array.from(uniqueDates.values())
            .map((date) => ({
                updateOne: {
                    filter: {
                        user: userId,
                        habit: habit._id,
                        date
                    },
                    update: {
                        $setOnInsert: {
                            completedAt: date,
                            source: 'manual'
                        }
                    },
                    upsert: true
                }
            }));
    });

    if (operations.length === 0) return;

    await HabitCompletion.bulkWrite(operations, { ordered: false });
};
