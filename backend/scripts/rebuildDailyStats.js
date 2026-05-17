import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { refreshDailyStatsForRange } from '../src/utils/dailyStats.js';
import { startOfUtcDay } from '../src/utils/dateUtils.js';

dotenv.config();

const getArgValue = (name, fallback) => {
    const prefix = `--${name}=`;
    const arg = process.argv.find((item) => item.startsWith(prefix));

    return arg ? arg.slice(prefix.length) : fallback;
};

const days = Math.min(Math.max(Number(getArgValue('days', 365)) || 365, 1), 3650);
const userId = getArgValue('user', null);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const endDate = startOfUtcDay(new Date());
const startDate = new Date(endDate);
startDate.setUTCDate(endDate.getUTCDate() - (days - 1));

try {
    await mongoose.connect(databaseUrl, {
        serverSelectionTimeoutMS: 10000
    });

    const users = userId
        ? await User.find({ _id: userId }).select('_id').lean()
        : await User.find({}).select('_id').lean();

    for (const user of users) {
        await refreshDailyStatsForRange(user._id, startDate, endDate);
        console.log(`Rebuilt ${days} days of daily stats for user ${user._id}`);
    }

    console.log(`Done. Users processed: ${users.length}`);
    await mongoose.disconnect();
} catch (error) {
    console.error('Daily stat rebuild failed:', error);
    await mongoose.disconnect();
    process.exit(1);
}
