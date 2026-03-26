const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/token', authController.getToken);
router.post('/check-email', authController.checkEmail);
router.post('/change-password', authController.changePassword);
router.post('/promote', authController.promote);

module.exports = router;
