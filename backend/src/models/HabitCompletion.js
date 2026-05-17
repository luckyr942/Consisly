import mongoose from 'mongoose';

const habitCompletionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    habit: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Habit'
    },
    date: {
        type: Date,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['manual'],
        default: 'manual'
    }
}, {
    timestamps: true
});

habitCompletionSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });
habitCompletionSchema.index({ user: 1, date: -1 });
habitCompletionSchema.index({ habit: 1, date: -1 });

const HabitCompletion = mongoose.model('HabitCompletion', habitCompletionSchema);

export default HabitCompletion;
