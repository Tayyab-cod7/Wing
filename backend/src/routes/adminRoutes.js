const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Log middleware for debugging
router.use((req, res, next) => {
    console.log('Admin route accessed:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!req.headers.authorization
    });
    next();
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin only
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('email username phone referralCode balance activePackage packageAmount referredBy referralCount isAdmin active');
        
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
});

// @route   DELETE /api/admin/users/delete-non-admin
// @desc    Delete all non-admin users
// @access  Admin only
router.delete('/users/delete-non-admin', adminAuth, adminController.deleteNonAdminUsers);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Admin only
router.delete('/users/:userId', adminAuth, adminController.deleteUser);

// @route   PUT /api/admin/users/:userId/balance
// @desc    Update user balance
// @access  Admin only
router.put('/users/:userId/balance', adminAuth, adminController.updateUserBalance);

// @route   GET /api/admin/chats
// @desc    Get all chats
// @access  Admin only
router.get('/chats', adminAuth, async (req, res) => {
    try {
        // This is a placeholder - you'll need to implement the actual chat model and controller
        res.json({
            success: true,
            chats: []
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;