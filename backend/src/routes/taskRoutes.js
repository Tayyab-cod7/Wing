const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');

// Get task progress
router.get('/progress', auth, async (req, res) => {
    try {
        const now = new Date();
        // Calculate the start of the current minute
        const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: startOfMinute }
        });

        res.json({
            success: true,
            completedTasks
        });
    } catch (error) {
        console.error('Error fetching task progress:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check task limit
router.get('/check-limit', auth, async (req, res) => {
    try {
        const now = new Date();
        // Calculate the start of the current minute
        const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: startOfMinute }
        });

        const canPerformTask = completedTasks < 5;

        // The frontend will handle the minute timer display based on the minute-reset-time endpoint.
        // This endpoint just needs to say if they can perform a task in the current minute.
        res.json({
            canPerformTask
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

        // Check if user has reached daily limit -> now minute limit
        const now = new Date();
        // Calculate the start of the current minute
        const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);

        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            completedAt: { $gte: startOfMinute }
        });

        if (completedTasks >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Minute task limit reached'
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
        'captcha': 0.132, // Basic Plane 01 reward per task (0.66 / 5)
        'textCaptcha': 0.132,
        'imageCaptcha': 0.132,
        'sliderPuzzle': 0.132,
        'checkboxChallenge': 0.132
    };
    // You might want to make this dynamic based on user's plan
    // For now, hardcoding to 0.132 for all tasks/plans as per request.
    return rewards[taskType] || 0;
}

// GET time until next minute reset
router.get('/minute-reset-time', async (req, res) => {
    try {
        const now = new Date();
        const seconds = now.getSeconds();
        const timeUntilResetSeconds = 60 - seconds;

        res.json({
            success: true,
            timeUntilResetSeconds: timeUntilResetSeconds
        });
    } catch (error) {
        console.error('Error getting minute reset time:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 