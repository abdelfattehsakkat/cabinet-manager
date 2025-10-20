import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('mongoUri: ', mongoUri);
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
        
        // Handle connection events
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        if (error instanceof Error) {
            console.error(`MongoDB Connection Error: ${error.message}`);
            if (error.message.includes('ECONNREFUSED')) {
                console.error('Make sure MongoDB is running and accessible');
                console.error('Check if the Docker container is running and the port is correctly mapped');
            }
        } else {
            console.error('An unknown error occurred while connecting to MongoDB');
        }
        process.exit(1);
    }
};

export default connectDB;