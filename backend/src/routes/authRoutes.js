const express = require('express');
const router = express.Router();
const { register, login, getMe, adminLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

// Admin routes
router.post('/admin/login', adminLogin);

module.exports = router; 