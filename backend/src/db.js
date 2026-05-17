import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;
