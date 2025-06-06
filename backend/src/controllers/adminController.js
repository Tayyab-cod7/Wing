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
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Check if the user is an admin
        if (user.isAdmin || user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                error: 'Admin user cannot be deleted'
            });
        }
        
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
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