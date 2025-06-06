const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Admin credentials
    const adminEmail = 'admin@gmail.com';
    const adminUsername = 'admin12';
    const adminPassword = 'admin123';
    const adminReferral = '000000';

    console.log('\nAdmin credentials:');
    console.log('- Email:', adminEmail);
    console.log('- Username:', adminUsername);
    console.log('- Password:', adminPassword);
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

    console.log('Admin user verified:', {
      id: admin._id,
      email: admin.email,
      username: admin.username,
      isAdmin: admin.isAdmin,
      referralCode: admin.referralCode,
      passwordHash: admin.password.substring(0, 20) + '...'
    });

    // Test password
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    console.log('\nPassword verification:', isMatch ? 'Success ✅' : 'Failed ❌');

    if (!isMatch) {
      throw new Error('Password verification failed. Admin user may not be able to log in.');
    }

    console.log('\nAdmin user setup completed successfully!');

  } catch (error) {
    console.error('\nError in createAdmin:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

// Run the script
createAdmin(); 