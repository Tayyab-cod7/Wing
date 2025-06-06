const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: Number,
        required: true
    },
    taskType: {
        type: String,
        required: true,
        enum: ['captcha']
    },
    captchaText: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for faster queries
taskSchema.index({ userId: 1, taskId: 1, completedAt: 1 });

module.exports = mongoose.model('Task', taskSchema); 