const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'user' }));

// Admin routes - public (no auth required for admin service to call)
router.get('/all', userController.getAllUsers);

// User profile - Protected
router.get('/profile', verifyAuth, userController.getProfile);
router.put('/profile', verifyAuth, userController.updateProfile);
router.post('/profile', verifyAuth, userController.createProfile); // Add this route
router.post('/upload-image', verifyAuth, upload.single('imageUrl'), userController.uploadImage);

// Public profile
router.get('/public/:email', userController.getPublicProfile);

// Reputation management
router.get('/reputation/:email', userController.getReputation);
router.post('/reputation/:email/add', verifyAuth, userController.addReputation);
router.post('/reputation/:email/deduct', verifyAuth, userController.deductReputation);

// Admin actions - public (no auth required for admin service to call)
router.patch('/:email/ban', userController.toggleBan);

module.exports = router;
