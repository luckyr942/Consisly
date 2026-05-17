import mongoose from 'mongoose';

const dailyUserStatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: Date,
        required: true
    },
    totalHabits: {
        type: Number,
        default: 0,
        min: 0
    },
    completed: {
        type: Number,
        default: 0,
        min: 0
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

dailyUserStatSchema.index({ user: 1, date: 1 }, { unique: true });
dailyUserStatSchema.index({ user: 1, date: -1 });

const DailyUserStat = mongoose.model('DailyUserStat', dailyUserStatSchema);

export default DailyUserStat;
