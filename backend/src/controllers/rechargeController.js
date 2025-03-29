const Recharge = require('../models/Recharge');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/receipts/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
}).single('receipt');

// Submit recharge request
exports.submitRechargeRequest = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Please upload a receipt'
                });
            }

            const { requestId, amount, paymentMethod, tid } = req.body;

            // Validate required fields
            if (!requestId || !amount || !paymentMethod || !tid) {
                // Remove uploaded file if validation fails
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required fields'
                });
            }

            // Store only the relative path to the uploads directory
            const relativeImagePath = `uploads/receipts/${path.basename(req.file.path)}`;

            const recharge = new Recharge({
                requestId,
                userId: req.user.id,
                amount,
                paymentMethod,
                tid,
                receiptImage: relativeImagePath,
                receiptUploadDate: new Date()
            });

            await recharge.save();

            res.status(201).json({
                success: true,
                data: recharge
            });
        });
    } catch (error) {
        console.error('Error in submitRechargeRequest:', error);
        res.status(500).json({
            success: false,
            error: 'Error submitting recharge request'
        });
    }
};

// Get user's recharge records
exports.getMyRechargeRecords = async (req, res) => {
    try {
        const recharges = await Recharge.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        // Add full URL for receipt images
        const rechargesWithUrls = recharges.map(recharge => {
            const rechargeObj = recharge.toObject();
            if (rechargeObj.receiptImage) {
                // Make sure the path is correctly formed with the host
                rechargeObj.receiptImage = `${req.protocol}://${req.get('host')}/${rechargeObj.receiptImage}`;
            }
            return rechargeObj;
        });

        res.json({
            success: true,
            data: rechargesWithUrls
        });
    } catch (error) {
        console.error('Error in getMyRechargeRecords:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching recharge records'
        });
    }
};

// Get all recharge requests (admin only)
exports.getAllRechargeRequests = async (req, res) => {
    try {
        const recharges = await Recharge.find()
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        // Add full URL for receipt images
        const rechargesWithUrls = recharges.map(recharge => {
            const rechargeObj = recharge.toObject();
            if (rechargeObj.receiptImage) {
                // Make sure the path is correctly formed with the host
                rechargeObj.receiptImage = `${req.protocol}://${req.get('host')}/${rechargeObj.receiptImage}`;
            }
            return rechargeObj;
        });

        res.json({
            success: true,
            data: rechargesWithUrls
        });
    } catch (error) {
        console.error('Error in getAllRechargeRequests:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching recharge requests'
        });
    }
};

// Update recharge status (admin only)
exports.updateRechargeStatus = async (req, res) => {
    try {
        const recharge = await Recharge.findOne({ requestId: req.params.requestId });

        if (!recharge) {
            return res.status(404).json({
                success: false,
                error: 'Recharge request not found'
            });
        }

        recharge.status = req.params.status;
        
        // If approved, update user's balance
        if (req.params.status === 'approved') {
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a valid amount'
                });
            }

            // Find user and update their balance
            const user = await User.findById(recharge.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Update user's balance
            user.balance = (user.balance || 0) + parseFloat(amount);
            await user.save();

            // Store the credited amount in the recharge record
            recharge.creditedAmount = amount;
        }

        await recharge.save();

        res.json({
            success: true,
            data: recharge
        });
    } catch (error) {
        console.error('Error in updateRechargeStatus:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating recharge status'
        });
    }
};

exports.deleteRechargeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the recharge request by requestId only
        const recharge = await Recharge.findOne({ requestId: requestId });
        
        if (!recharge) {
            return res.status(404).json({
                success: false,
                error: 'Recharge request not found'
            });
        }

        // Delete the receipt image file if it exists
        if (recharge.receiptImage) {
            try {
                // Ensure we're using the correct path relative to the backend directory
                const imagePath = path.join(__dirname, '../../', recharge.receiptImage);
                console.log('Attempting to delete file at path:', imagePath);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('File deleted successfully');
                } else {
                    console.log('File not found at path:', imagePath);
                }
            } catch (fileError) {
                console.error('Error deleting file:', fileError);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete the recharge request from database using requestId
        const deleteResult = await Recharge.findOneAndDelete({ requestId: requestId });

        if (!deleteResult) {
            return res.status(404).json({
                success: false,
                error: 'Failed to delete recharge request from database'
            });
        }

        res.json({
            success: true,
            message: 'Recharge request deleted successfully'
        });
    } catch (error) {
        console.error('Detailed error in deleteRechargeRequest:', error);
        res.status(500).json({
            success: false,
            error: 'Server error: Failed to delete recharge request'
        });
    }
}; 