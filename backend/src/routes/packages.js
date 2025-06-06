const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Get all packages
router.get('/', async (req, res) => {
    try {
        const packages = [
            {
                id: 'basic1',
                name: 'Basic 1',
                price: 500,
                dailyEarning: 75,
                validity: 30
            },
            {
                id: 'basic2',
                name: 'Basic 2',
                price: 1000,
                dailyEarning: 150,
                validity: 30
            },
            {
                id: 'basic3',
                name: 'Basic 3',
                price: 1500,
                dailyEarning: 225,
                validity: 30
            },
            {
                id: 'basic4',
                name: 'Basic 4',
                price: 2000,
                dailyEarning: 300,
                validity: 30
            },
            {
                id: 'pro1',
                name: 'Pro 1',
                price: 3000,
                dailyEarning: 500,
                validity: 30
            },
            {
                id: 'pro2',
                name: 'Pro 2',
                price: 4000,
                dailyEarning: 650,
                validity: 30
            },
            {
                id: 'pro3',
                name: 'Pro 3',
                price: 5000,
                dailyEarning: 800,
                validity: 30
            },
            {
                id: 'premium1',
                name: 'Premium 1',
                price: 10000,
                dailyEarning: 1500,
                validity: 30
            },
            {
                id: 'premium2',
                name: 'Premium 2',
                price: 15000,
                dailyEarning: 2000,
                validity: 30
            },
            {
                id: 'premium3',
                name: 'Premium 3',
                price: 20000,
                dailyEarning: 3000,
                validity: 30
            }
        ];

        res.json({
            success: true,
            packages
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch packages'
        });
    }
});

// Get user's active package
router.get('/active', protect, async (req, res) => {
    try {
        const user = req.user;
        if (!user.activePackage) {
            return res.json({
                success: true,
                hasActivePackage: false
            });
        }

        res.json({
            success: true,
            hasActivePackage: true,
            package: {
                id: user.activePackage,
                dailyEarning: user.dailyEarningRate,
                startDate: user.packageStartDate,
                endDate: user.packageEndDate
            }
        });
    } catch (error) {
        console.error('Error fetching active package:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active package'
        });
    }
});

module.exports = router; 