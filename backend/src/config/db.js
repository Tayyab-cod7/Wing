const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MongoDB URI environment variable (MONGODB_URI or MONGO_URI) is not defined');
        }

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        // Log additional connection details for debugging
        console.error('Connection details:', {
            uri: process.env.MONGODB_URI || process.env.MONGO_URI,
            host: mongoose.connection.host,
            readyState: mongoose.connection.readyState
        });
        process.exit(1);
    }
};

module.exports = connectDB; 