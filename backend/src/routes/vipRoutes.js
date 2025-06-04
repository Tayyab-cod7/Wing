const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const vipController = require('../controllers/vipController');

// Upgrade VIP endpoint
router.post('/upgrade', auth, vipController.upgradeVip);

// Cancel VIP endpoint
router.post('/cancel', auth, vipController.cancelVip);

module.exports = router; 