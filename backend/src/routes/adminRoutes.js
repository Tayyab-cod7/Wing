const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin only
router.get('/users', adminAuth, adminController.getUsers);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Admin only
router.delete('/users/:userId', adminAuth, adminController.deleteUser);

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