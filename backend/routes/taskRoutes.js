const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');

// Get task progress
router.get('/progress', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: today }
        });

        // Calculate time until reset (next day)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timeUntilReset = tomorrow - new Date();

        res.json({
            success: true,
            completedTasks,
            timeUntilReset: formatTimeUntilReset(timeUntilReset)
        });
    } catch (error) {
        console.error('Error fetching task progress:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check task limit
router.get('/check-limit', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: today }
        });

        const canPerformTask = completedTasks < 5;

        // Calculate time until reset
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timeUntilReset = tomorrow - new Date();

        res.json({
            canPerformTask,
            timeUntilReset: formatTimeUntilReset(timeUntilReset)
        });
    } catch (error) {
        console.error('Error checking task limit:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Complete task
router.post('/complete', auth, async (req, res) => {
    try {
        const { taskType, captchaText } = req.body;

        // Check if user has reached daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: today }
        });

        if (completedTasks >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Daily task limit reached'
            });
        }

        // Create new task completion record
        const task = new Task({
            userId: req.user.id,
            taskType,
            captchaText,
            completedAt: new Date()
        });

        await task.save();

        // Update user's balance based on task type
        const rewardAmount = getTaskReward(taskType);
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { balance: rewardAmount }
        });

        res.json({
            success: true,
            message: 'Task completed successfully',
            reward: rewardAmount
        });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper function to format time until reset
function formatTimeUntilReset(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

// Helper function to get task reward
function getTaskReward(taskType) {
    const rewards = {
        'captcha': 0.50,
        'textCaptcha': 0.50,
        'imageCaptcha': 0.75,
        'sliderPuzzle': 0.75,
        'checkboxChallenge': 0.50
    };
    return rewards[taskType] || 0;
}

module.exports = router; 