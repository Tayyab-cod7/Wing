const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI;

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminReferral = process.env.ADMIN_REFERRAL;
    const adminPhone = process.env.ADMIN_PHONE;

    console.log('\nAdmin credentials:');
    console.log('- Email:', adminEmail);
    console.log('- Username:', adminUsername);
    console.log('- Phone:', adminPhone);
    console.log('- Referral Code:', adminReferral);

    // Delete existing admin user if exists
    console.log('\nDeleting existing admin user if exists...');
    await User.deleteOne({ email: adminEmail });
    console.log('Existing admin user deleted');

    console.log('\nCreating new admin user...');
    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      username: adminUsername,
      password: adminPassword, // Save as plain text, let model hash it
      phone: adminPhone,
      isAdmin: true,
      referralCode: adminReferral,
      referredBy: adminReferral,
      balance: 150,
      totalEarnings: 150
    });
    
    try {
      const savedUser = await adminUser.save();
      console.log('Admin user created successfully:', {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        phone: savedUser.phone,
        isAdmin: savedUser.isAdmin
      });
    } catch (saveError) {
      console.error('Error saving admin user:', saveError);
      throw saveError;
    }

    // Verify admin user
    console.log('\nVerifying admin user...');
    const admin = await User.findOne({ email: adminEmail }).select('+password');
    
    if (!admin) {
      throw new Error('Admin user not found after creation');
    }

    console.log('Admin user verified successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin(); 