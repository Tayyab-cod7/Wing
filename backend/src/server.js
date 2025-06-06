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

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5000', 'https://wing-production-232c.up.railway.app'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Origin blocked:', origin);
            return callback(null, true); // Allow all origins in production
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Essential middleware
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
    console.log('Request received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        body: req.body,
        headers: {
            authorization: req.headers.authorization ? 'present' : 'none',
            'content-type': req.headers['content-type'],
            origin: req.headers.origin
        }
    });
    next();
});

// Package configuration
const PACKAGES = {
    'basic1': { price: 500, dailyRate: 75 },
    'basic2': { price: 1000, dailyRate: 150 },
    'basic3': { price: 1500, dailyRate: 225 },
    'basic4': { price: 2000, dailyRate: 300 }
};

// API Routes - make sure these come before static file serving
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file handling
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Catch-all route for SPA - make sure this comes after API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        path: req.path
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('\nAvailable routes:');
    console.log('- /api/auth/*');
    console.log('- /api/admin/*');
    console.log('- /api/earnings/*');
});