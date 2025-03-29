const User = require('../models/User');

// @desc    Earn daily reward
// @route   POST /api/earn
// @access  Private
exports.earnDaily = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update earnings
        const earnAmount = 50;
        user.programEarnings = (user.programEarnings || 0) + earnAmount;
        user.totalEarnings = (user.totalEarnings || 150) + earnAmount;

        await user.save();

        res.json({
            success: true,
            amount: earnAmount,
            programEarnings: user.programEarnings,
            referralEarnings: user.referralEarnings || 0,
            totalEarnings: user.totalEarnings
        });
    } catch (error) {
        console.error('Error in earnDaily:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing earnings'
        });
    }
};

// @desc    Get user earnings
// @route   POST /api/earnings
// @access  Private
exports.getEarnings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            programEarnings: user.programEarnings || 0,
            referralEarnings: user.referralEarnings || 0,
            totalEarnings: Math.max(user.totalEarnings || 0, 150)
        });
    } catch (error) {
        console.error('Error in getEarnings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching earnings'
        });
    }
};

// @desc    Withdraw earnings
// @route   POST /api/withdraw
// @access  Private
exports.withdrawEarnings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if there are enough earnings to withdraw
        if (user.totalEarnings <= 50) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance for withdrawal'
            });
        }

        // Reset earnings but maintain minimum balance
        user.programEarnings = 0;
        user.referralEarnings = 0;
        user.totalEarnings = 50;

        await user.save();

        res.json({
            success: true,
            message: 'Withdrawal successful'
        });
    } catch (error) {
        console.error('Error in withdrawEarnings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing withdrawal'
        });
    }
};