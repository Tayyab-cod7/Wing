const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Log middleware for debugging
router.use((req, res, next) => {
    console.log('Admin route accessed:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!req.headers.authorization,
        timestamp: new Date().toISOString(),
        origin: req.headers.origin,
        fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl
    });
    next();
});

// Protected admin routes - all routes require admin authentication
router.use(adminAuth);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin only
router.get('/users', adminController.getUsers);

// Test route to verify admin API is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is working',
        timestamp: new Date().toISOString()
    });
});

// @route   DELETE /api/admin/users/delete-non-admin
// @desc    Delete all non-admin users
// @access  Admin only
router.post('/delete-non-admin', adminController.deleteNonAdminUsers);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Admin only
router.delete('/users/:userId', adminController.deleteUser);

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

router.post('/reset-admin-referrals', adminController.resetAdminReferralData);
router.post('/recalculate-referrals', adminController.recalculateReferralCounts);
router.post('/update-admin-codes', adminController.updateAdminReferralCodes);

module.exports = router;