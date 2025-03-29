const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// Get all withdrawal records for the authenticated user
router.get('/records', auth, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ userId: req.user.id })
            .sort({ requestDate: -1 })
            .select('requestId amount paymentMethod status tid requestDate accountNumber');

        const formattedWithdrawals = withdrawals.map(w => ({
            requestId: w.requestId,
            amount: w.amount,
            paymentMethod: w.paymentMethod,
            status: w.status,
            tid: w.status === 'pending' ? w.accountNumber : (w.tid || 'N/A'),
            accountNumber: w.accountNumber,
            requestDate: w.requestDate
        }));

        res.json(formattedWithdrawals);
    } catch (error) {
        console.error('Error fetching withdrawal records:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all withdrawal requests (admin only)
router.get('/admin/requests', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const withdrawals = await Withdrawal.find()
            .sort({ requestDate: -1 })
            .select('requestId amount paymentMethod status tid requestDate accountNumber userId')
            .populate('userId', 'phone');

        const formattedWithdrawals = withdrawals.map(w => ({
            requestId: w.requestId,
            amount: w.amount,
            paymentMethod: w.paymentMethod,
            status: w.status,
            tid: w.tid || 'N/A',
            accountNumber: w.accountNumber,
            requestDate: w.requestDate,
            phone: w.userId ? w.userId.phone : 'N/A'
        }));

        res.json(formattedWithdrawals);
    } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Approve withdrawal request (admin only)
router.post('/admin/approve', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { requestId, tid } = req.body;

        if (!requestId || !tid) {
            return res.status(400).json({
                success: false,
                error: 'Request ID and TID are required'
            });
        }

        const withdrawal = await Withdrawal.findOne({ requestId });
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: 'Withdrawal request not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Withdrawal request has already been processed'
            });
        }

        withdrawal.status = 'approved';
        withdrawal.tid = tid;
        await withdrawal.save();

        res.json({
            success: true,
            message: 'Withdrawal request approved successfully'
        });
    } catch (error) {
        console.error('Error approving withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while approving withdrawal'
        });
    }
});

// Reject withdrawal request (admin only)
router.post('/admin/reject', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: 'Request ID is required'
            });
        }

        const withdrawal = await Withdrawal.findOne({ requestId });
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: 'Withdrawal request not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Withdrawal request has already been processed'
            });
        }

        // Get user to refund the amount
        const user = await User.findById(withdrawal.userId);
        if (user) {
            user.balance += withdrawal.amount;
            await user.save();
        }

        withdrawal.status = 'rejected';
        await withdrawal.save();

        res.json({
            success: true,
            message: 'Withdrawal request rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while rejecting withdrawal'
        });
    }
});

// Delete withdrawal request (admin only)
router.post('/admin/delete', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                error: 'Request ID is required'
            });
        }

        const withdrawal = await Withdrawal.findOne({ requestId });
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                error: 'Withdrawal request not found'
            });
        }

        // If the request is pending, refund the amount to user
        if (withdrawal.status === 'pending') {
            const user = await User.findById(withdrawal.userId);
            if (user) {
                user.balance += withdrawal.amount;
                await user.save();
            }
        }

        // Delete the withdrawal request
        await Withdrawal.deleteOne({ requestId: requestId });

        res.json({
            success: true,
            message: 'Withdrawal request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting withdrawal request:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting withdrawal'
        });
    }
});

// Create a new withdrawal request
router.post('/request', auth, async (req, res) => {
    try {
        console.log('Received withdrawal request:', req.body);
        console.log('User ID:', req.user.id);

        const { amount, paymentMethod, accountNumber, finalAmount } = req.body;

        // Validate input
        if (!amount || !paymentMethod || !accountNumber || !finalAmount) {
            console.log('Missing required fields:', { amount, paymentMethod, accountNumber, finalAmount });
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Check if amount is a valid number
        if (isNaN(amount) || amount <= 0) {
            console.log('Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }

        // Get user's current balance
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found:', req.user.id);
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('User current balance:', user.balance);

        // Check if user has sufficient balance
        if (user.balance < amount) {
            console.log('Insufficient balance:', { userBalance: user.balance, requestedAmount: amount });
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance'
            });
        }

        // Generate request ID
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const requestId = `WIT${year}${month}${day}${random}`;

        // Create withdrawal request
        const withdrawal = new Withdrawal({
            requestId,
            userId: req.user.id,
            amount,
            finalAmount,
            paymentMethod,
            accountNumber,
            status: 'pending',
            tid: accountNumber, // Set initial TID as the account number
            requestDate: date
        });

        console.log('Created withdrawal object:', withdrawal);

        // Save withdrawal request
        await withdrawal.save();
        console.log('Saved withdrawal request');

        // Deduct amount from user's balance
        user.balance -= amount;
        await user.save();
        console.log('Updated user balance');

        res.json({
            success: true,
            message: 'Withdrawal request created successfully',
            withdrawal: {
                requestId: withdrawal.requestId,
                amount: withdrawal.amount,
                paymentMethod: withdrawal.paymentMethod,
                status: withdrawal.status,
                tid: withdrawal.tid || 'N/A',
                requestDate: withdrawal.requestDate
            }
        });
    } catch (error) {
        console.error('Error creating withdrawal request:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Server error while processing withdrawal request',
            details: error.message
        });
    }
});

module.exports = router; 