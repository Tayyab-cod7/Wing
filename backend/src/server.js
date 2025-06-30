const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const earningRoutes = require('./routes/earningRoutes');
const { protect } = require('./middleware/authMiddleware');
const User = require('./models/User');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// CORS configuration
const corsOptions = {
    origin: [
        'https://wing-production.up.railway.app',
        'https://amiable-essence-production.up.railway.app',
        'https://wing-production-232c.up.railway.app',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS with configuration
app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log('Request received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        protocol: req.protocol,
        secure: req.secure,
        headers: {
            authorization: req.headers.authorization ? 'present' : 'none',
            'content-type': req.headers['content-type'],
            origin: req.headers.origin,
            'x-forwarded-proto': req.headers['x-forwarded-proto']
        }
    });
    next();
});

// Health check endpoint - place this before API routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        protocol: req.protocol,
        secure: req.secure,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API Routes - make sure these come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningRoutes);

// API 404 handler for /api routes
app.all('/api/*', (req, res) => {
    console.log('API 404:', req.method, req.path);
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        path: req.path,
        method: req.method
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('Allowed Origins:', corsOptions.origin);
    console.log('\nAvailable routes:');
    console.log('- /api/auth/*');
    console.log('- /api/admin/*');
    console.log('- /api/earnings/*');
});