const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const earningRoutes = require('./src/routes/earningRoutes');
const withdrawalRoutes = require('./src/routes/withdrawalRoutes');
const rechargeRoutes = require('./src/routes/rechargeRoutes');
const packages = require('./src/routes/packages');
const referralRoutes = require('./src/routes/referralRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const bonusRoutes = require('./src/routes/bonusRoutes');
const vipRoutes = require('./src/routes/vipRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
console.log('Allowed Origins:', allowedOrigins);

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS with specific origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin);
      return callback(null, false);
    }
    console.log('Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API root route
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'API root' });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'API root' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/packages', packages);
app.use('/api/referrals', referralRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/bonus', bonusRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// General 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});