const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Task = require('../models/Task');

// In-memory lock to prevent concurrent submissions
const submissionLocks = new Map();

// Function to acquire lock
const acquireLock = (userId, taskId) => {
    const lockKey = `${userId}-${taskId}`;
    if (submissionLocks.has(lockKey)) {
        return false;
    }
    submissionLocks.set(lockKey, true);
    return true;
};

// Function to release lock
const releaseLock = (userId, taskId) => {
    const lockKey = `${userId}-${taskId}`;
    submissionLocks.delete(lockKey);
};

// Function to get daily earning rate based on package
function getDailyEarningRate(packageName) {
    const rates = {
        'Basic Plane 01': 0.66,
        'Basic Plane 02': 1.2,
        'Basic Plane 03': 2.5,
        'Pro Plane 01': 6,
        'Pro Plane 02': 10,
        'Pro Plane 03': 20,
        'Premium Plane 01': 50,
        'Premium Plane 02': 200
    };
    return rates[packageName] || 0;
}

// Get completed tasks for today
router.get('/completed', protect, async (req, res) => {
    try {
        // Get tasks completed in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
        const tasks = await Task.find({
            userId: req.user.id,
            completedAt: {
                $gte: twentyFourHoursAgo
            }
        });

        // Get user's package info
        const user = await User.findById(req.user.id);
        const dailyRate = getDailyEarningRate(user.activePackage);
        const perTaskEarning = dailyRate / 5; // Divide daily rate by 5 tasks

        res.json({
            success: true,
            completedTasks: tasks.length,
            completedTaskIds: tasks.map(task => task.taskId),
            nextResetTime: tasks.length > 0 ? 
                new Date(tasks[0].completedAt.getTime() + (24 * 60 * 60 * 1000)).getTime() 
                : null,
            dailyEarningRate: dailyRate,
            perTaskEarning: perTaskEarning,
            remainingEarnings: dailyRate - (tasks.length * perTaskEarning)
        });
    } catch (error) {
        console.error('Error getting completed tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting completed tasks'
        });
    }
});

// Complete a task
router.post('/complete', protect, async (req, res) => {
    const userId = req.user.id;
    const { taskId, taskType, captchaText } = req.body;

    try {
        // Validate input
        if (!taskId || !taskType || !captchaText) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Try to acquire lock
        if (!acquireLock(userId, taskId)) {
            return res.status(429).json({
                success: false,
                message: 'Task submission in progress, please wait'
            });
        }

        // Check if user has an active package
        const user = await User.findById(userId);
        if (!user.activePackage) {
            releaseLock(userId, taskId);
            return res.status(400).json({
                success: false,
                message: 'You need an active package to complete tasks'
            });
        }

        // Get earning rate based on package
        const dailyRate = getDailyEarningRate(user.activePackage);
        const perTaskEarning = dailyRate / 5; // Divide daily rate by 5 tasks

        // Check if task was already completed in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
        const existingTask = await Task.findOne({
            userId: userId,
            taskId: taskId,
            completedAt: {
                $gte: twentyFourHoursAgo
            }
        });

        if (existingTask) {
            releaseLock(userId, taskId);
            return res.status(400).json({
                success: false,
                message: 'Task already completed within the last 24 hours'
            });
        }

        // Check if user has completed all tasks for today
        const completedTasksCount = await Task.countDocuments({
            userId: userId,
            completedAt: {
                $gte: twentyFourHoursAgo
            }
        });

        if (completedTasksCount >= 5) {
            releaseLock(userId, taskId);
            return res.status(400).json({
                success: false,
                message: 'Maximum tasks completed for today'
            });
        }

        // Create task record
        const task = await Task.create({
            userId: userId,
            taskId,
            taskType,
            captchaText,
            completedAt: new Date(),
            earnAmount: perTaskEarning
        });

        // Update user balance
        user.balance += perTaskEarning;
        await user.save();

        // Release lock before sending response
        releaseLock(userId, taskId);

        res.json({
            success: true,
            message: 'Task completed successfully',
            earnAmount: perTaskEarning,
            totalEarned: (completedTasksCount + 1) * perTaskEarning,
            remainingTasks: 5 - (completedTasksCount + 1),
            dailyEarningRate: dailyRate,
            nextResetTime: new Date(task.completedAt.getTime() + (24 * 60 * 60 * 1000)).getTime()
        });

    } catch (error) {
        // Make sure to release lock on error
        releaseLock(userId, taskId);
        console.error('Error completing task:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing task'
        });
    }
});

// Reset completed tasks
router.post('/reset', protect, async (req, res) => {
    try {
        // Delete all tasks completed today for this user
        await Task.deleteMany({
            userId: req.user.id,
            completedAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });

        res.json({
            success: true,
            message: 'Tasks reset successfully'
        });
    } catch (error) {
        console.error('Error resetting tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting tasks'
        });
    }
});

module.exports = router; 