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
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
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

// API Routes
console.log('Starting route registration...');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningRoutes);

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Log all registered routes
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`Route registered: ${Object.keys(r.route.methods)} ${r.route.path}`);
    }
});

// Static file handling after API routes
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler - must be last
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.originalUrl);
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('\nAvailable routes:');
    console.log('- /api/auth/*');
    console.log('- /api/admin/*');
    console.log('- /api/earnings/*');
    console.log('- /api/test (GET)');
});