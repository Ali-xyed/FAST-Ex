const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/send-otp', authController.sendOTP);
router.post('/login', authController.login);
router.post('/token', authController.getToken);
router.post('/check-email', authController.checkEmail);
router.post('/change-password', authController.changePassword);
router.post('/promote', authController.promote);
router.patch('/toggle-ban', authController.toggleBan);

module.exports = router;
