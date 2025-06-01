const mongoose = require('mongoose');
const User = require('../src/models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning';

async function deleteUserByPhone(phoneNumber) {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    console.log(`\nAttempting to delete user with phone number: ${phoneNumber}`);
    const deleteResult = await User.deleteOne({ phone: phoneNumber });

    if (deleteResult.deletedCount > 0) {
      console.log(`Successfully deleted user with phone number ${phoneNumber}`);
    } else {
      console.log(`No user found with phone number ${phoneNumber} to delete.`);
    }

  } catch (error) {
    console.error('\nError in deleteUserByPhone:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

// Run the script with the phone number to delete
const targetPhoneNumber = '03151251123'; // The old admin user's phone number
deleteUserByPhone(targetPhoneNumber); 