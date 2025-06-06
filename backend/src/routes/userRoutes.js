const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .select('+activePackage +packageAmount +packageStartDate +packageEndDate +dailyEarningRate +level');
        
        res.json({
            success: true,
            user: {
                ...user.toObject(),
                hasActivePackage: !!user.activePackage
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user balance
router.get('/balance', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('balance');
        res.json({
            success: true,
            balance: user.balance
        });
    } catch (error) {
        console.error('Error fetching user balance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check package status
router.get('/package-status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('activePackage packageAmount packageStartDate packageEndDate dailyEarningRate level');
        
        console.log('Package status check for user:', user); // Debug log
        
        res.json({
            success: true,
            hasActivePackage: !!user.activePackage,
            package: user.activePackage ? {
                id: user.activePackage,
                amount: user.packageAmount,
                startDate: user.packageStartDate,
                endDate: user.packageEndDate,
                dailyEarningRate: user.dailyEarningRate,
                level: user.level
            } : null
        });
    } catch (error) {
        console.error('Error checking package status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 