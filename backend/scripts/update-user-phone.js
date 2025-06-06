const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function updateUserPhone() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find user by referral code
    const referralCode = '537722';
    console.log('Looking for user with referral code:', referralCode);
    
    const user = await User.findOne({ referralCode });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      username: user.username
    });
    
    // Update user's phone number
    console.log('Updating user phone number...');
    user.phone = '03151251123'; // Using the same number for testing
    await user.save();
    
    console.log('User phone number updated successfully:', {
      id: user._id,
      email: user.email,
      username: user.username,
      phone: user.phone
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

updateUserPhone(); 