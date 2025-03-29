const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const rechargeController = require('../controllers/rechargeController');

// User routes
router.post('/request', auth, rechargeController.submitRechargeRequest);
router.get('/my-records', auth, rechargeController.getMyRechargeRecords);

// Admin routes
router.get('/admin/requests', adminAuth, rechargeController.getAllRechargeRequests);
router.post('/admin/:requestId/:status', adminAuth, rechargeController.updateRechargeStatus);
router.delete('/admin/delete/:requestId', adminAuth, rechargeController.deleteRechargeRequest);

module.exports = router; 