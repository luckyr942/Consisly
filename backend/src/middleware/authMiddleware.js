import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return res.status(401).json({ message: 'Not authorized, use Bearer token' });
    }

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Not authorized, token expired' });
        }

        console.error(error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    try {
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        return next();
    } catch (error) {
        console.error('User lookup failed in auth middleware:', error);
        return res.status(500).json({ message: 'Auth database lookup failed' });
    }
};
