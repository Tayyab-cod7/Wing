const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminPhone = '03151251123';
    const adminPassword = 'admin123';

    console.log('Testing login with admin credentials:');
    console.log('- Phone:', adminPhone);
    console.log('- Password:', adminPassword);

    // Find the admin user
    const user = await User.findOne({ phone: adminPhone }).select('+password');
    
    if (!user) {
      console.error('Admin user not found!');
      return;
    }

    console.log('Admin user found:');
    console.log('- ID:', user._id);
    console.log('- Is Admin:', user.isAdmin);
    console.log('- Password Hash:', user.password);

    // Test password comparison
    console.log('\nTesting password comparison...');
    const isMatch = await bcrypt.compare(adminPassword, user.password);
    console.log('Password match result:', isMatch);

    // Test JWT token generation
    console.log('\nTesting JWT token generation...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'exists' : 'missing');
    
    try {
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      console.log('Token generated successfully:', token.substring(0, 20) + '...');
      
      // Verify the token
      console.log('\nVerifying the token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT Error:', jwtError);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testLogin(); 