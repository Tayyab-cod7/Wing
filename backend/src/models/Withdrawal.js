const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    finalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    tid: {
        type: String
    },
    requestDate: {
        type: Date,
        default: Date.now
    }
});

// Generate request ID before saving
withdrawalSchema.pre('save', function(next) {
    if (!this.requestId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.requestId = `WIT${year}${month}${day}${random}`;
    }
    next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema); 