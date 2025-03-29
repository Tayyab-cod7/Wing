const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function restoreAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Admin credentials from .env
    const adminPhone = process.env.ADMIN_PHONE || '03151251123';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminReferral = process.env.ADMIN_REFERRAL || '000000';

    console.log('Admin credentials:');
    console.log('- Phone:', adminPhone);
    console.log('- Password:', adminPassword);
    console.log('- Referral Code:', adminReferral);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    console.log('Password hashed successfully');

    console.log('Checking if admin user exists...');
    const existingAdmin = await User.findOne({ phone: adminPhone });

    if (existingAdmin) {
      console.log('Admin user already exists, updating admin privileges...');
      
      // Update admin user directly in the database to ensure all fields are set correctly
      const updateResult = await User.updateOne(
        { _id: existingAdmin._id },
        {
          $set: {
            isAdmin: true,
            referralCode: adminReferral,
            password: hashedPassword,
            referredBy: adminReferral,
            name: 'Admin User',
            balance: 150,
            totalEarnings: 150
          }
        }
      );
      
      console.log('Admin user updated successfully:', updateResult);
    } else {
      console.log('Admin user does not exist, creating new admin user...');
      
      // Create admin user
      const adminUser = new User({
        phone: adminPhone,
        password: hashedPassword,
        isAdmin: true,
        referralCode: adminReferral,
        referredBy: adminReferral,
        name: 'Admin User',
        balance: 150,
        totalEarnings: 150
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }

    // Verify admin user
    const admin = await User.findOne({ phone: adminPhone }).select('+password');
    console.log('Admin user verified:', {
      id: admin._id,
      phone: admin.phone,
      isAdmin: admin.isAdmin,
      referralCode: admin.referralCode,
      passwordHash: admin.password.substring(0, 20) + '...'
    });

    // Test password
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    console.log('Password verification:', isMatch ? 'Success ✅' : 'Failed ❌');

    if (!isMatch) {
      console.log('WARNING: Password verification failed. This may cause login issues.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
restoreAdmin();