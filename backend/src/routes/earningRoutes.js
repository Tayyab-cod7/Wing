const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Handler function for earnings data
const getEarningsData = async (req, res) => {
    try {
        // Get user from auth middleware
        const user = req.user;

        res.json({
            success: true,
            referralCount: user.referralCount || 0,
            referralEarnings: user.referralEarnings || 0,
            programEarnings: user.programEarnings || 0,
            totalEarnings: user.totalEarnings || 0,
            balance: user.balance || 0  // Include current balance
        });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch earnings data'
        });
    }
};

// Earn daily reward
router.post('/earn', protect, async (req, res) => {
    try {
        const user = req.user;

        // Calculate earnings based on user's active package
        const dailyEarningRate = user.dailyEarningRate || 100; // Default to 100 if no package
        
        // Update user's earnings
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $inc: {
                    programEarnings: dailyEarningRate,
                    totalEarnings: dailyEarningRate,
                    balance: dailyEarningRate
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Daily reward earned successfully',
            dailyEarningRate: dailyEarningRate,
            programEarnings: updatedUser.programEarnings,
            referralEarnings: updatedUser.referralEarnings,
            totalEarnings: updatedUser.totalEarnings,
            balance: updatedUser.balance
        });

    } catch (error) {
        console.error('Error in earn daily:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to earn daily reward'
        });
    }
});

// Routes
router.get('/earnings', protect, getEarningsData);
router.get('/', protect, async (req, res) => {
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
            balance: user.balance,
            programEarnings: user.programEarnings,
            referralEarnings: user.referralEarnings,
            totalEarnings: user.balance,
            dailyEarningRate: user.dailyEarningRate,
            activePackage: user.activePackage
        });
    } catch (error) {
        console.error('Error getting earnings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get earnings'
        });
    }
});

// Purchase route
router.post('/purchase', protect, async (req, res) => {
    try {
        console.log('Purchase request received:', req.body);
        
        const { amount, packageId } = req.body;
        const numericAmount = Number(amount);
        
        // Find user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already has an active package
        if (user.activePackage) {
            const currentDate = new Date();
            const packageEndDate = user.packageEndDate || new Date(0);

            if (currentDate < packageEndDate) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have an active package. Please wait for it to expire before purchasing a new one.',
                    remainingDays: Math.ceil((packageEndDate - currentDate) / (1000 * 60 * 60 * 24))
                });
            }
        }

        // Check balance
        if (user.balance < numericAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Required: Rs. ${numericAmount}, Available: Rs. ${user.balance}`
            });
        }

        // Calculate package end date (30 days from now)
        const packageStartDate = new Date();
        const packageEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update user balance and package information
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { 
                $inc: { balance: -numericAmount },
                $set: { 
                    activePackage: packageId,
                    packageAmount: numericAmount, // Save the package amount
                    dailyEarningRate: packageId === 'basic1' ? 75 :
                                    packageId === 'basic2' ? 150 :
                                    packageId === 'basic3' ? 225 :
                                    packageId === 'basic4' ? 300 :
                                    packageId === 'pro1' ? 500 :
                                    packageId === 'pro2' ? 650 :
                                    packageId === 'pro3' ? 800 :
                                    packageId === 'premium1' ? 1500 :
                                    packageId === 'premium2' ? 2000 :
                                    packageId === 'premium3' ? 3000 : 100,
                    packageStartDate: packageStartDate,
                    packageEndDate: packageEndDate
                }
            },
            { new: true }
        );

        // If user was referred by someone, update referrer's earnings
        if (user.referredBy && user.referredBy !== '000000') {
            const referrer = await User.findOne({ referralCode: user.referredBy });
            if (referrer) {
                const commission = Math.floor(numericAmount * 0.1); // 10% commission

                // Update referrer with new commission
                await User.findByIdAndUpdate(referrer._id, {
                    $push: { 
                        commissionHistory: {
                            amount: commission,
                            packageAmount: numericAmount,
                            date: new Date()
                        }
                    },
                    $inc: { 
                        balance: commission,
                        referralEarnings: commission,
                        totalEarnings: commission
                    }
                });
            }
        }

        console.log('Purchase successful:', {
            amount: numericAmount,
            newBalance: updatedUser.balance,
            activePackage: updatedUser.activePackage,
            dailyEarningRate: updatedUser.dailyEarningRate,
            packageStartDate: updatedUser.packageStartDate,
            packageEndDate: updatedUser.packageEndDate
        });

        res.json({
            success: true,
            message: 'Package purchased successfully',
            balance: updatedUser.balance,
            activePackage: updatedUser.activePackage,
            dailyEarningRate: updatedUser.dailyEarningRate,
            packageEndDate: updatedUser.packageEndDate
        });

    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process purchase'
        });
    }
});

// Add a new route to check package status
router.get('/package-status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentDate = new Date();
        const packageEndDate = user.packageEndDate || new Date(0);

        // Check if package has expired
        if (currentDate >= packageEndDate) {
            // Reset package information if expired
            if (user.activePackage) {
                await User.findByIdAndUpdate(user._id, {
                    $unset: {
                        activePackage: "",
                        dailyEarningRate: "",
                        packageStartDate: "",
                        packageEndDate: ""
                    }
                });
            }

            return res.json({
                success: true,
                hasActivePackage: false,
                message: 'No active package'
            });
        }

        // Package is still active
        const currentTimestamp = new Date().getTime();
        const endTimestamp = packageEndDate.getTime();
        const remainingSeconds = Math.max(0, Math.floor((endTimestamp - currentTimestamp) / 1000));

        res.json({
            success: true,
            hasActivePackage: true,
            activePackage: user.activePackage,
            packageEndDate: packageEndDate.toISOString(),
            remainingSeconds: remainingSeconds
        });

    } catch (error) {
        console.error('Error checking package status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check package status'
        });
    }
});

// Add a route to cancel package
router.post('/cancel-package', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.activePackage) {
            return res.status(400).json({
                success: false,
                message: 'No active package to cancel'
            });
        }

        // Reset package information
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $unset: {
                    activePackage: "",
                    dailyEarningRate: "",
                    packageStartDate: "",
                    packageEndDate: ""
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Package cancelled successfully'
        });

    } catch (error) {
        console.error('Error canceling package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel package'
        });
    }
});

module.exports = router;