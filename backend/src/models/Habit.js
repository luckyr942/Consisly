import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Please add a habit name'],
        trim: true,
        maxlength: 80
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    icon: {
        type: String,
        trim: true,
        maxlength: 16
    },
    color: {
        type: String,
        trim: true,
        maxlength: 16
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    completedDates: [{
        // Legacy field. New completions are stored in HabitCompletion.
        type: Date
    }],
    reminderType: {
        type: String,
        enum: ['none', 'daily', 'interval'],
        default: 'none'
    },
    reminderTime: {
        type: String // ISO string for daily specific time
    },
    intervalValue: {
        type: Number // e.g., 30, 2
    },
    intervalUnit: {
        type: String,
        enum: ['minutes', 'hours']
    }
}, {
    timestamps: true
});

habitSchema.index({ user: 1, status: 1, createdAt: -1 });

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;
