import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import DailyUserStat from '../models/DailyUserStat.js';
import User from '../models/User.js';
import { startOfUtcDay } from '../utils/dateUtils.js';
import { recalculateConsistencyScore } from '../utils/consistencyScore.js';
import { checkAndUnlockBadges } from '../utils/badgeService.js';
import { syncLegacyCompletionsForUser } from '../utils/syncLegacyCompletions.js';
import { findHabitForUser, isValidObjectId } from '../utils/habitOwnership.js';
import { refreshDailyStat, refreshDailyStatsForRange } from '../utils/dailyStats.js';

const normalizeText = (value) => typeof value === 'string' ? value.trim() : value;
const getCompletionDate = (dateValue) => {
    const targetDate = startOfUtcDay(dateValue ? new Date(dateValue) : new Date());

    return Number.isNaN(targetDate.getTime()) ? null : targetDate;
};

const attachCompletedDates = async (userId, habits) => {
    const habitList = habits.map((habit) => habit.toObject ? habit.toObject() : habit);
    const habitIds = habitList.map((habit) => habit._id);

    if (habitIds.length === 0) return habitList;

    const completions = await HabitCompletion.find({
        user: userId,
        habit: { $in: habitIds }
    }).sort({ date: 1 }).lean();

    const completionsByHabit = completions.reduce((map, completion) => {
        const habitId = completion.habit.toString();
        const dates = map.get(habitId) || [];

        dates.push(completion.date);
        map.set(habitId, dates);

        return map;
    }, new Map());

    return habitList.map((habit) => ({
        ...habit,
        completedDates: completionsByHabit.get(habit._id.toString()) || []
    }));
};

const attachCompletedDatesForHabit = async (userId, habit) => {
    const [habitWithCompletions] = await attachCompletedDates(userId, [habit]);

    return habitWithCompletions;
};

const encodeHabitCursor = (habit) => {
    if (!habit) return null;

    return Buffer.from(JSON.stringify({
        createdAt: habit.createdAt,
        id: habit._id
    })).toString('base64url');
};

const decodeHabitCursor = (cursor) => {
    if (!cursor) return null;

    try {
        const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
        const createdAt = new Date(parsed.createdAt);

        if (Number.isNaN(createdAt.getTime()) || !isValidObjectId(parsed.id)) {
            return null;
        }

        return {
            createdAt,
            id: parsed.id
        };
    } catch {
        return null;
    }
};

export const getHabits = async (req, res) => {
    await syncLegacyCompletionsForUser(req.user._id);

    const requestedLimit = Number(req.query.limit);
    const shouldPaginate = Number.isInteger(requestedLimit) && requestedLimit > 0;
    const limit = shouldPaginate ? Math.min(requestedLimit, 50) : null;
    const query = { user: req.user._id };
    const cursor = decodeHabitCursor(req.query.cursor);

    if (req.query.cursor && !cursor) {
        return res.status(400).json({ message: 'Invalid pagination cursor' });
    }

    if (cursor) {
        query.$or = [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor.id } }
        ];
    }

    const habitsQuery = Habit.find(query).sort({ createdAt: -1, _id: -1 });
    const habits = await (limit ? habitsQuery.limit(limit + 1) : habitsQuery);
    const hasNextPage = limit ? habits.length > limit : false;
    const visibleHabits = limit ? habits.slice(0, limit) : habits;
    const habitsWithCompletions = await attachCompletedDates(req.user._id, habits);

    if (limit) {
        return res.status(200).json({
            items: habitsWithCompletions.slice(0, limit),
            pageInfo: {
                hasNextPage,
                nextCursor: hasNextPage ? encodeHabitCursor(visibleHabits.at(-1)) : null
            }
        });
    }

    return res.status(200).json(habitsWithCompletions);
};

export const createHabit = async (req, res) => {
    const { name, description, frequency, icon, color } = req.body;
    const habitName = normalizeText(name);
    const habitDescription = normalizeText(description);

    if (!habitName) {
        return res.status(400).json({ message: 'Habit name is required' });
    }

    if (frequency && !['daily', 'weekly'].includes(frequency)) {
        return res.status(400).json({ message: 'Frequency must be daily or weekly' });
    }

    const habit = await Habit.create({
        user: req.user._id,
        name: habitName,
        description: habitDescription,
        frequency,
        icon: normalizeText(icon),
        color: normalizeText(color)
    });

    await recalculateConsistencyScore(req.user._id);
    await refreshDailyStat(req.user._id);
    const unlockedBadges = await checkAndUnlockBadges(req.user._id);
    const habitWithCompletions = await attachCompletedDatesForHabit(req.user._id, habit);

    return res.status(201).json({
        habit: habitWithCompletions,
        unlockedBadges
    });
};

export const updateHabit = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid habit id' });
    }

    const habit = await findHabitForUser(req.params.id, req.user._id);

    if (!habit) {
        return res.status(404).json({ message: 'Habit not found' });
    }

    const { name, description, frequency, completedDate, completed, icon, color, status } = req.body;

    if (name !== undefined) {
        const habitName = normalizeText(name);

        if (!habitName) {
            return res.status(400).json({ message: 'Habit name is required' });
        }

        habit.name = habitName;
    }

    if (description !== undefined) habit.description = normalizeText(description);
    if (icon !== undefined) habit.icon = normalizeText(icon);
    if (color !== undefined) habit.color = normalizeText(color);

    if (frequency !== undefined) {
        if (!['daily', 'weekly'].includes(frequency)) {
            return res.status(400).json({ message: 'Frequency must be daily or weekly' });
        }

        habit.frequency = frequency;
    }

    if (status !== undefined) {
        if (!['active', 'archived'].includes(status)) {
            return res.status(400).json({ message: 'Status must be active or archived' });
        }

        habit.status = status;
    }

    if (completedDate !== undefined || completed !== undefined) {
        if (completed !== undefined && typeof completed !== 'boolean') {
            return res.status(400).json({ message: 'Completed must be true or false' });
        }

        const targetDate = getCompletionDate(completedDate);

        if (!targetDate) {
            return res.status(400).json({ message: 'Invalid completion date' });
        }

        if (completed === false) {
            await HabitCompletion.deleteOne({
                user: req.user._id,
                habit: habit._id,
                date: targetDate
            });
        } else {
            await HabitCompletion.updateOne(
                {
                    user: req.user._id,
                    habit: habit._id,
                    date: targetDate
                },
                {
                    $setOnInsert: {
                        completedAt: new Date(),
                        source: 'manual'
                    }
                },
                { upsert: true }
            );
        }
    }

    const updatedHabit = await habit.save();
    const consistencyScore = await recalculateConsistencyScore(req.user._id);
    await refreshDailyStat(req.user._id);
    const unlockedBadges = await checkAndUnlockBadges(req.user._id);
    const habitWithCompletions = await attachCompletedDatesForHabit(req.user._id, updatedHabit);

    return res.status(200).json({
        habit: habitWithCompletions,
        consistencyScore,
        unlockedBadges
    });
};

export const checkInHabit = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid habit id' });
    }

    const habit = await findHabitForUser(req.params.id, req.user._id);

    if (!habit) {
        return res.status(404).json({ message: 'Habit not found' });
    }

    const targetDate = getCompletionDate(req.body?.date);

    if (!targetDate) {
        return res.status(400).json({ message: 'Invalid completion date' });
    }

    await HabitCompletion.updateOne(
        {
            user: req.user._id,
            habit: habit._id,
            date: targetDate
        },
        {
            $setOnInsert: {
                completedAt: new Date(),
                source: 'manual'
            }
        },
        { upsert: true }
    );

    const consistencyScore = await recalculateConsistencyScore(req.user._id);
    await refreshDailyStat(req.user._id, targetDate);
    const unlockedBadges = await checkAndUnlockBadges(req.user._id);
    const habitWithCompletions = await attachCompletedDatesForHabit(req.user._id, habit);

    return res.status(200).json({
        habit: habitWithCompletions,
        consistencyScore,
        unlockedBadges
    });
};

export const removeHabitCheckIn = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid habit id' });
    }

    const habit = await findHabitForUser(req.params.id, req.user._id);

    if (!habit) {
        return res.status(404).json({ message: 'Habit not found' });
    }

    const targetDate = getCompletionDate(req.query?.date);

    if (!targetDate) {
        return res.status(400).json({ message: 'Invalid completion date' });
    }

    await HabitCompletion.deleteOne({
        user: req.user._id,
        habit: habit._id,
        date: targetDate
    });

    const consistencyScore = await recalculateConsistencyScore(req.user._id);
    await refreshDailyStat(req.user._id, targetDate);
    const habitWithCompletions = await attachCompletedDatesForHabit(req.user._id, habit);

    return res.status(200).json({
        habit: habitWithCompletions,
        consistencyScore
    });
};

export const deleteHabit = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid habit id' });
    }

    const habit = await findHabitForUser(req.params.id, req.user._id);

    if (!habit) {
        return res.status(404).json({ message: 'Habit not found' });
    }

    await habit.deleteOne();
    const deletedCompletions = await HabitCompletion.find({
        user: req.user._id,
        habit: habit._id
    }).select('date').lean();
    const affectedDateKeys = new Set(deletedCompletions.map((completion) => (
        startOfUtcDay(completion.date).toISOString()
    )));

    await HabitCompletion.deleteMany({
        user: req.user._id,
        habit: habit._id
    });

    const consistencyScore = await recalculateConsistencyScore(req.user._id);
    await refreshDailyStat(req.user._id);

    await Promise.all(Array.from(affectedDateKeys).map((dateKey) => (
        refreshDailyStat(req.user._id, new Date(dateKey))
    )));

    return res.status(200).json({
        message: 'Habit deleted',
        consistencyScore
    });
};

export const getHabitStats = async(req, res) =>{
    await syncLegacyCompletionsForUser(req.user._id);

    const habits = await Habit.find({ user: req.user._id, status: { $ne: 'archived' } });
    const user = await User.findById(req.user._id).select('consistencyScore');

    const today = startOfUtcDay(new Date());
    const completedToday = await HabitCompletion.countDocuments({
        user: req.user._id,
        habit: { $in: habits.map((habit) => habit._id) },
        date: today
    });

    return res.status(200).json({
        totalHabits: habits.length,
        completedToday,
        consistencyScore: user?.consistencyScore || 0
    });
};

export const getHabitAnalytics = async (req, res) => {
    await syncLegacyCompletionsForUser(req.user._id);

    const requestedDays = Number(req.query.days || 7);
    const days = Number.isInteger(requestedDays)
        ? Math.min(Math.max(requestedDays, 1), 90)
        : 7;
    const today = startOfUtcDay(new Date());
    const startDate = new Date(today);

    startDate.setUTCDate(today.getUTCDate() - (days - 1));

    await refreshDailyStatsForRange(req.user._id, startDate, today);

    const stats = await DailyUserStat.find({
        user: req.user._id,
        date: { $gte: startDate, $lte: today }
    }).sort({ date: 1 }).lean();
    const statsByDate = stats.reduce((map, stat) => {
        map.set(startOfUtcDay(stat.date).toISOString(), stat);
        return map;
    }, new Map());

    const daily = Array.from({ length: days }).map((_, index) => {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + index);

        const key = date.toISOString();
        const stat = statsByDate.get(key);

        return {
            date: key.slice(0, 10),
            label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
            completed: stat?.completed || 0,
            totalHabits: stat?.totalHabits || 0,
            completionRate: stat?.completionRate || 0
        };
    });

    const totalCompletions = daily.reduce((sum, day) => sum + day.completed, 0);
    const totalHabits = daily.at(-1)?.totalHabits || 0;
    const averageCompletionRate = daily.length > 0
        ? Math.round(daily.reduce((sum, day) => sum + day.completionRate, 0) / daily.length)
        : 0;

    return res.status(200).json({
        days: daily,
        summary: {
            totalHabits,
            totalCompletions,
            averageCompletionRate
        }
    });
};
