const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateUserPassword() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Admin credentials
    const phone = '03151251123';
    const password = 'admin123';
    
    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);
    
    // Update the user directly in the database
    console.log('Updating user password directly in the database...');
    const result = await mongoose.connection.collection('users').updateOne(
      { phone },
      { $set: { password: hashedPassword } }
    );
    
    console.log('Update result:', result);
    
    if (result.matchedCount === 0) {
      console.error('User not found');
    } else if (result.modifiedCount === 0) {
      console.log('Password was not changed (might be the same as before)');
    } else {
      console.log('Password updated successfully');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

updateUserPassword(); 