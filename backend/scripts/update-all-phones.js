const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

async function updateAllPhones() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Update all users that don't have a phone number
    const result = await User.updateMany(
      { $or: [{ phone: { $exists: false } }, { phone: null }] },
      { $set: { phone: '03151251123' } }
    );

    console.log('Update result:', {
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

updateAllPhones(); 