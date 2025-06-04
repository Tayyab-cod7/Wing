const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./src/routes/authRoutes');
const rechargeRoutes = require('./src/routes/rechargeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const withdrawalRoutes = require('./src/routes/withdrawalRoutes');
const bonusRoutes = require('./src/routes/bonusRoutes');
const vipRoutes = require('./src/routes/vipRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5000', 'http://192.168.18.5:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  
  // Add detailed logging for login endpoint
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    console.log('Login request body:', JSON.stringify(req.body));
  }
  
  // Capture original send method
  const originalSend = res.send;
  res.send = function(body) {
    if (req.path === '/api/auth/login') {
      console.log('Login response:', body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// API health check
app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// API Routes - must come before static files
app.use('/api/auth', authRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', require('./src/routes/earningRoutes'));
app.use('/api/contact', contactRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/bonus', bonusRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const receiptsDir = path.join(uploadsDir, 'receipts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory:', uploadsDir);
}
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir);
    console.log('Created receipts directory:', receiptsDir);
}

// Serve static files from uploads directory - with detailed logging
app.use('/uploads', (req, res, next) => {
    console.log('Static file request for uploads:', req.url);
    console.log('Full path:', path.join(__dirname, 'uploads', req.url));
    // Check if file exists
    const filePath = path.join(__dirname, 'uploads', req.url);
    if (fs.existsSync(filePath)) {
        console.log('File exists at path:', filePath);
    } else {
        console.log('File NOT found at path:', filePath);
    }
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Log all static file requests
app.use((req, res, next) => {
    if (req.url.startsWith('/uploads')) {
        console.log('Uploads access:', req.url);
    }
    next();
});

// Static files
app.use((req, res, next) => {
  console.log('Static file request:', {
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  next();
}, express.static(path.join(__dirname, '../frontend/public')));

app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  }
});