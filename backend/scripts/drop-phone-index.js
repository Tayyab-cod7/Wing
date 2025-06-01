const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://Tayyab:Online789@earning.hmvp9.mongodb.net/?retryWrites=true&w=majority&appName=Earning';

async function dropPhoneIndex() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('users'); // Assuming your user collection is named 'users'

    console.log('\nFetching indexes for the users collection...');
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(idx => idx.name));

    const phoneIndexName = 'phone_1';
    const phoneIndexExists = indexes.some(index => index.name === phoneIndexName);

    if (phoneIndexExists) {
      console.log(`\nDropping index: ${phoneIndexName}`);
      await collection.dropIndex(phoneIndexName);
      console.log(`${phoneIndexName} index dropped successfully.`);
    } else {
      console.log(`Index ${phoneIndexName} not found. No action needed.`);
    }

  } catch (error) {
    console.error('\nError in dropPhoneIndex:', error);
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
dropPhoneIndex(); 