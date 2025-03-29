const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Recharge = require('../src/models/Recharge');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const updateReceiptPaths = async () => {
    try {
        console.log('Updating receipt image paths...');
        
        // Get all recharge records
        const recharges = await Recharge.find({});
        console.log(`Found ${recharges.length} recharge records.`);
        
        let updatedCount = 0;
        
        for (const recharge of recharges) {
            if (recharge.receiptImage) {
                // Check if the path is already in the correct format
                if (!recharge.receiptImage.startsWith('uploads/')) {
                    // Extract the filename from the full path
                    const filename = path.basename(recharge.receiptImage);
                    // Create the new relative path
                    const newPath = `uploads/receipts/${filename}`;
                    
                    // Update the record
                    recharge.receiptImage = newPath;
                    await recharge.save();
                    
                    updatedCount++;
                    console.log(`Updated path for recharge ${recharge.requestId}: ${newPath}`);
                }
            }
        }
        
        console.log(`Path update complete. Updated ${updatedCount} records.`);
    } catch (error) {
        console.error('Error updating receipt paths:', error);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

updateReceiptPaths(); 