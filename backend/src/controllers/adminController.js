const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        // First, fix admin referral count
        const adminUser = await User.findOne({ isAdmin: true });
        if (adminUser) {
            // Count how many users were actually referred by admin
            const referredUsersCount = await User.countDocuments({ 
                referredBy: adminUser.referralCode,
                isAdmin: false // Don't count other admin users
            });

            console.log('Admin referral check:', {
                adminUsername: adminUser.username,
                currentCount: adminUser.referralCount,
                actualCount: referredUsersCount
            });

            // Update if count is different
            if (adminUser.referralCount !== referredUsersCount) {
                await User.findByIdAndUpdate(adminUser._id, {
                    referralCount: referredUsersCount
                });
                console.log(`Updated admin referral count to ${referredUsersCount}`);
            }
        }

        // Get all users as normal
        const users = await User.find()
            .select('_id email username phone referralCode balance activePackage packageAmount referredBy referralCount isAdmin active');
        
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

// Reset admin referral data
exports.resetAdminReferralData = async (req, res) => {
    try {
        // Find all admin users
        const adminUsers = await User.find({ isAdmin: true });
        
        // Reset their referral data
        for (const admin of adminUsers) {
            admin.referralCode = 'N/A';
            admin.referredBy = 'N/A';
            admin.referralCount = 0;
            await admin.save();
        }

        res.status(200).json({
            success: true,
            message: 'Admin referral data reset successfully',
            count: adminUsers.length
        });
    } catch (error) {
        console.error('Error resetting admin referral data:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user to be deleted
        const userToDelete = await User.findById(userId);
        
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is admin
        if (userToDelete.isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete admin user'
            });
        }

        // If user was referred by someone, update their referrer's count
        if (userToDelete.referredBy) {
            const referrer = await User.findOne({ referralCode: userToDelete.referredBy });
            if (referrer && referrer.referralCount > 0) {
                referrer.referralCount -= 1;
                await referrer.save();
                console.log(`Updated referrer ${referrer.username}'s count to ${referrer.referralCount}`);
            }
        }

        // Delete the user
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

        // First, get all non-admin users to be deleted
        const usersToDelete = await User.find({
            $and: [
                { isAdmin: { $ne: true } },
                { _id: { $ne: req.user._id } } // Don't delete the current user
            ]
        });

        console.log(`Found ${usersToDelete.length} non-admin users to delete`);

        if (usersToDelete.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No non-admin users found to delete',
                details: {
                    found: 0,
                    deleted: 0
                }
            });
        }

        // Update referral counts for all referrers
        const referralUpdates = {};
        for (const user of usersToDelete) {
            if (user.referredBy) {
                referralUpdates[user.referredBy] = (referralUpdates[user.referredBy] || 0) + 1;
            }
        }

        // Apply referral count updates
        for (const [referralCode, count] of Object.entries(referralUpdates)) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                referrer.referralCount = Math.max(0, (referrer.referralCount || 0) - count);
                await referrer.save();
                console.log('Updated referrer count:', {
                    referrerId: referrer._id,
                    referralCode,
                    newCount: referrer.referralCount
                });
            }
        }
        
        // Delete the users
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
                found: usersToDelete.length,
                deleted: result.deletedCount,
                referralUpdates: Object.keys(referralUpdates).length
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

// Recalculate and update referral counts
exports.recalculateReferralCounts = async (req, res) => {
    try {
        // Get all users
        const users = await User.find();
        console.log(`Total users found: ${users.length}`);
        
        // Create a map to store referral counts
        const referralCounts = {};
        
        // Count actual referrals for each user
        for (const user of users) {
            if (user.referredBy) {
                // Only count if the referred user is not deleted
                referralCounts[user.referredBy] = (referralCounts[user.referredBy] || 0) + 1;
            }
        }
        
        // Log referral counts before update
        console.log('Current referral counts:', referralCounts);
        
        // Update each user's referral count
        const updatePromises = users.map(async (user) => {
            const actualCount = referralCounts[user.referralCode] || 0;
            if (user.referralCount !== actualCount) {
                console.log(`Updating ${user.username}'s referral count:`, {
                    oldCount: user.referralCount,
                    newCount: actualCount,
                    referralCode: user.referralCode
                });
                
                await User.findByIdAndUpdate(user._id, {
                    referralCount: actualCount
                });
            }
        });
        
        await Promise.all(updatePromises);
        
        // Get updated users to verify changes
        const updatedUsers = await User.find();
        const updatedCounts = {};
        updatedUsers.forEach(user => {
            if (user.referralCount > 0) {
                updatedCounts[user.username] = {
                    referralCode: user.referralCode,
                    count: user.referralCount
                };
            }
        });
        
        console.log('Updated referral counts:', updatedCounts);
        
        res.status(200).json({
            success: true,
            message: 'Referral counts recalculated and updated successfully',
            updatedCounts
        });
    } catch (error) {
        console.error('Error recalculating referral counts:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update admin referral codes
exports.updateAdminReferralCodes = async (req, res) => {
    try {
        // Find admin user and update referral codes
        const adminUser = await User.findOneAndUpdate(
            { isAdmin: true },
            { 
                referralCode: '000000',
                referredBy: '000000'
            },
            { new: true }
        );

        if (!adminUser) {
            return res.status(404).json({
                success: false,
                error: 'Admin user not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admin referral codes updated successfully',
            user: {
                username: adminUser.username,
                referralCode: adminUser.referralCode,
                referredBy: adminUser.referredBy
            }
        });
    } catch (error) {
        console.error('Error updating admin referral codes:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}; 