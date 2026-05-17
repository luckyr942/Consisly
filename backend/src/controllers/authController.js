import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const buildUserResponse = (user) => {
    return {
        _id: user._id,
        email: user.email,
        consistencyScore: user.consistencyScore,
        token: generateToken(user._id)
    };
};

export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please use a valid email address' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        return res.status(409).json({ message: 'User already exists' });
    }

    let user;

    try {
        user = await User.create({
            email: normalizedEmail,
            password
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User already exists' });
        }

        throw error;
    }

    return res.status(201).json(buildUserResponse(user));
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.status(200).json(buildUserResponse(user));
};

export const getUserProfile = async (req, res) => {
    return res.status(200).json(req.user);
};
