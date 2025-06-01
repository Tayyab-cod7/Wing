const mongoose = require('mongoose');
const User = require('../src/models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning';

async function deleteUserByEmail(email) {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    console.log(`\nAttempting to delete user with email: ${email}`);
    const deleteResult = await User.deleteOne({ email: email });

    if (deleteResult.deletedCount > 0) {
      console.log(`Successfully deleted user with email ${email}`);
    } else {
      console.log(`No user found with email ${email} to delete.`);
    }

  } catch (error) {
    console.error('\nError in deleteUserByEmail:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

// Run the script with the email to delete
const targetEmail = 'admin@gmail.com'; // The admin user's email
deleteUserByEmail(targetEmail); 