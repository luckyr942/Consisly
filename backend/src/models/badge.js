import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    },

    badgeKey:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    unlockedAt:{
        type: Date,
        default: Date.now
    },
    
},
    {
        timestamps:true,
});

badgeSchema.index({ user: 1, badgeKey:1}, {unique: true});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;