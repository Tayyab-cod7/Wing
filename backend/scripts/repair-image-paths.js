const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
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

// Helper function to cleanup file paths
function cleanupImagePath(filePath) {
    // If path includes the full directory structure, extract just the filename
    if (filePath.includes('uploads/receipts/')) {
        const parts = filePath.split('uploads/receipts/');
        return `uploads/receipts/${parts[parts.length - 1]}`;
    }
    
    // If it's just a filename, return uploads/receipts/filename
    const filename = path.basename(filePath);
    return `uploads/receipts/${filename}`;
}

const repairImagePaths = async () => {
    try {
        console.log('Repairing receipt image paths...');
        
        // Get all recharge records
        const recharges = await Recharge.find({});
        console.log(`Found ${recharges.length} recharge records.`);
        
        let updatedCount = 0;
        let missingFiles = 0;
        
        for (const recharge of recharges) {
            if (recharge.receiptImage) {
                // Clean up the path
                const cleanPath = cleanupImagePath(recharge.receiptImage);
                
                // Check if the file exists
                const fullPath = path.join(__dirname, '../', cleanPath);
                const fileExists = fs.existsSync(fullPath);
                
                console.log(`Record ID: ${recharge._id}`);
                console.log(`  Original path: ${recharge.receiptImage}`);
                console.log(`  Cleaned path: ${cleanPath}`);
                console.log(`  Full path: ${fullPath}`);
                console.log(`  File exists: ${fileExists}`);
                
                // Update the record if the path has changed
                if (recharge.receiptImage !== cleanPath) {
                    recharge.receiptImage = cleanPath;
                    await recharge.save();
                    updatedCount++;
                    console.log(`  ✅ Updated path for recharge ${recharge.requestId}`);
                }
                
                if (!fileExists) {
                    missingFiles++;
                    console.log(`  ❌ WARNING: File does not exist at ${fullPath}`);
                }
            }
        }
        
        console.log(`Repair complete:`);
        console.log(`- Updated ${updatedCount} records`);
        console.log(`- Found ${missingFiles} missing files`);
        
    } catch (error) {
        console.error('Error repairing receipt paths:', error);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
};

repairImagePaths(); 