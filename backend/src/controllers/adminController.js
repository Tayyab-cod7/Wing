const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('_id email username referralCode balance activePackage packageAmount referredBy referralCount isAdmin');
        
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        console.log('Starting single user deletion');
        const userId = req.params.userId;
        
        // Log the current user making the request
        console.log('Request user:', req.user ? {
            id: req.user._id,
            isAdmin: req.user.isAdmin
        } : 'No user in request');
        
        // Check admin privileges
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Admin privileges required'
            });
        }
        
        console.log('Attempting to delete user:', userId);
        const user = await User.findById(userId);
        
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Check if trying to delete current user
        if (user._id.toString() === req.user._id.toString()) {
            console.log('Attempted to delete current user');
            return res.status(403).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }
        
        // Check if the user is an admin
        if (user.isAdmin) {
            console.log('Attempted to delete admin user');
            return res.status(403).json({
                success: false,
                error: 'Admin user cannot be deleted'
            });
        }
        
        await User.findByIdAndDelete(userId);
        console.log('User deleted successfully:', userId);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteUser:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Update user balance
exports.updateUserBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { balance } = req.body;

        // Validate balance
        if (typeof balance !== 'number' || balance < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid balance amount'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update user balance
        user.balance = balance;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User balance updated successfully',
            balance: user.balance
        });
    } catch (error) {
        console.error('Error updating user balance:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Admin middleware
exports.isAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};

// Delete all non-admin users
exports.deleteNonAdminUsers = async (req, res) => {
    try {
        console.log('Starting deletion of non-admin users');
        
        // Log the current user making the request
        console.log('Request user:', req.user ? {
            id: req.user._id,
            isAdmin: req.user.isAdmin
        } : 'No user in request');

        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Admin privileges required'
            });
        }
        
        // First, count how many users will be affected
        const countToDelete = await User.countDocuments({ 
            $and: [
                { isAdmin: { $ne: true } },
                { _id: { $ne: req.user._id } } // Don't delete the current user
            ]
        });
        console.log(`Found ${countToDelete} non-admin users to delete`);
        
        if (countToDelete === 0) {
            return res.status(200).json({
                success: true,
                message: 'No non-admin users found to delete',
                details: {
                    found: 0,
                    deleted: 0
                }
            });
        }
        
        // Only delete non-admin users and protect the current user
        const result = await User.deleteMany({
            $and: [
                { isAdmin: { $ne: true } },
                { _id: { $ne: req.user._id } } // Don't delete the current user
            ]
        });
        console.log('Delete operation result:', result);
        
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} non-admin users.`,
            details: {
                found: countToDelete,
                deleted: result.deletedCount
            }
        });
    } catch (error) {
        console.error('Error in deleteNonAdminUsers:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}; 