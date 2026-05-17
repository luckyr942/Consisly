import dotenv from 'dotenv';
import connectDB from './src/db.js';
import app from './src/app.js';

// 1. Load environment variables
dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
    console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

// 2. Connect to MongoDB
connectDB();

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0",() => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});
