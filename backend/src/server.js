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
    : [
        'http://localhost:5000',
        'http://localhost:3000',
        'https://wing-production-232c.up.railway.app'
    ];

// Force HTTPS in production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
});

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
        if (!origin) return callback(null, true);
        
        console.log('Request from origin:', origin);
        // In production, allow all origins
        if (process.env.NODE_ENV === 'production') {
            return callback(null, true);
        }
        
        // In development, check against allowedOrigins
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('Not allowed by CORS'));
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: true,
    optionsSuccessStatus: 204
}));

// Security headers
app.use((req, res, next) => {
    // Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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

// Static file handling
app.use(express.static(path.join(__dirname, '../../frontend/public')));

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
    console.log('Allowed Origins:', allowedOrigins);
    console.log('\nAvailable routes:');
    console.log('- /api/auth/*');
    console.log('- /api/admin/*');
    console.log('- /api/earnings/*');
});