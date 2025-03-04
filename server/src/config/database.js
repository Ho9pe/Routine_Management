const mongoose = require('mongoose');

// Load environment variables
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            // MongoDB connection options
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Handle MongoDB connection errors
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        // Handle application termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;