const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskType: {
        type: String,
        required: true,
        enum: ['captcha', 'textCaptcha', 'imageCaptcha', 'sliderPuzzle', 'checkboxChallenge']
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

// Create index for faster queries
taskSchema.index({ userId: 1, completedAt: 1 });

module.exports = mongoose.model('Task', taskSchema); 