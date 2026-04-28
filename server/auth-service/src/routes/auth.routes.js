const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

//  Authentication
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/send-otp', authController.sendOTP);
router.post('/login', authController.login);
router.post('/token', authController.getToken);
router.post('/check-email', authController.checkEmail);
router.post('/change-password', authController.changePassword);

// Admin actions
router.post('/promote', verifyAuth, authController.promote);
router.patch('/toggle-ban', verifyAuth, authController.toggleBan);

module.exports = router;
