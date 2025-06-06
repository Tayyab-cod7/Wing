const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user's referral info
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get referrals (users who used this user's referral code)
        const referrals = await User.find({ referredBy: user.referralCode })
            .select('username createdAt activePackage packageAmount');

        res.json({
            success: true,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: user.referralEarnings,
            referrals: referrals.map(ref => ({
                username: ref.username,
                joinedAt: ref.createdAt,
                activePackage: ref.activePackage,
                packageAmount: ref.packageAmount
            }))
        });
    } catch (error) {
        console.error('Error fetching referral info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch referral information'
        });
    }
});

// Get referral commission history
router.get('/commission-history', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            commissionHistory: user.commissionHistory || []
        });
    } catch (error) {
        console.error('Error fetching commission history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch commission history'
        });
    }
});

module.exports = router; 