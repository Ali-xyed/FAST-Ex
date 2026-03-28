const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'user' }));

router.get('/all', verifyAuth, userController.getAllUsers);
router.get('/profile', verifyAuth, userController.getProfile);
router.put('/profile', verifyAuth, userController.updateProfile);
router.post('/upload-image', verifyAuth, upload.single('imageUrl'), userController.uploadImage);

router.get('/public/:email', userController.getPublicProfile);
router.get('/reputation/:email', userController.getReputation);
router.post('/reputation/:email/add', verifyAuth, userController.addReputation);
router.post('/reputation/:email/deduct', verifyAuth, userController.deductReputation);
router.patch('/:email/ban', verifyAuth, userController.toggleBan);

module.exports = router;
