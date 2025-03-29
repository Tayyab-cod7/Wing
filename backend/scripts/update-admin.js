const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function updateAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find admin user
    const phone = '03151251123';
    
    console.log('Looking for admin user...');
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.error('Admin user not found');
      process.exit(1);
    }
    
    console.log('Admin user found:', {
      id: user._id,
      phone: user.phone,
      isAdmin: user.isAdmin
    });
    
    // Update isAdmin flag
    console.log('Updating isAdmin flag...');
    user.isAdmin = true;
    await user.save();
    
    console.log('Admin user updated:', {
      id: user._id,
      phone: user.phone,
      isAdmin: user.isAdmin
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

updateAdmin(); 