import Badge from '../models/badge.js';

export const getMyBadges = async (req, res) => {
    const badges = await Badge.find({ user: req.user._id }).sort({ unlockedAt: -1 });

    return res.status(200).json(badges);
};
