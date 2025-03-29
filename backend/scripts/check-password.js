const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function checkPassword() {
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
    const password = 'admin123';
    
    console.log('Looking for admin user...');
    
    // Find the user with password field included
    const user = await User.findOne({ phone }).select('+password');
    
    if (!user) {
      console.error('Admin user not found');
      process.exit(1);
    }
    
    console.log('Admin user found:', {
      id: user._id,
      phone: user.phone,
      isAdmin: user.isAdmin,
      passwordExists: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Check if password matches
    console.log('Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password matches:', isMatch);
    
    // Create a new hashed password
    console.log('Creating new hashed password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('New hashed password:', hashedPassword);
    
    // Update the user's password
    console.log('Updating user password...');
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

checkPassword(); 