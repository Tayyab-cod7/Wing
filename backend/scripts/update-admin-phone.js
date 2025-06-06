const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function updateAdminPhone() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find admin user
    console.log('Looking for admin user...');
    const admin = await User.findOne({ isAdmin: true });
    
    if (!admin) {
      console.error('Admin user not found');
      process.exit(1);
    }
    
    console.log('Admin user found:', {
      id: admin._id,
      email: admin.email,
      username: admin.username,
      isAdmin: admin.isAdmin
    });
    
    // Update admin phone
    console.log('Updating admin phone number...');
    admin.phone = '03151251123';
    await admin.save();
    
    console.log('Admin phone number updated successfully:', {
      id: admin._id,
      email: admin.email,
      username: admin.username,
      phone: admin.phone,
      isAdmin: admin.isAdmin
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

updateAdminPhone(); 