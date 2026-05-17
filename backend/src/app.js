import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

const apiRateStore = new Map();

const rateLimit = (req, res, next) => {
    const windowMs = 15 * 60 * 1000;
    const maxRequests = Number(process.env.RATE_LIMIT_MAX || 300);
    const now = Date.now();
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const current = apiRateStore.get(key);

    if (!current || current.resetAt <= now) {
        apiRateStore.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
        return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    return next();
};

app.set('trust proxy', 1);

app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    return next();
});

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || !isProduction || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '25kb' }));
morgan.token('request-id', (req) => req.requestId);
app.use(rateLimitEnabled ? rateLimit : (req, res, next) => next());
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Consisly API is running smoothly'
    });
});

app.get('/ready', (req, res) => {
    const isDatabaseReady = mongoose.connection.readyState === 1;

    res.status(isDatabaseReady ? 200 : 503).json({
        status: isDatabaseReady ? 'ready' : 'not_ready',
        database: isDatabaseReady ? 'connected' : 'disconnected'
    });
});

app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/badges', badgeRoutes);

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
    console.error({
        requestId: req.requestId,
        error
    });

    const statusCode = error.message === 'Not allowed by CORS'
        ? 403
        : res.statusCode === 200 ? 500 : res.statusCode;
    const message = isProduction && statusCode >= 500
        ? 'Server error'
        : error.message || 'Server error';

    res.status(statusCode).json({
        requestId: req.requestId,
        message
    });
});

export default app;
