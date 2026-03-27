const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'user' }));

router.get('/profile', verifyAuth, userController.getProfile);
router.put('/profile', verifyAuth, userController.updateProfile);
router.post('/profile/image', verifyAuth, upload.single('image'), userController.uploadImage);

router.get('/:email', verifyAuth, userController.getPublicProfile);
router.get('/:email/reputation', verifyAuth, userController.getReputation);
router.post('/:email/reputation/add', verifyAuth, userController.addReputation);
router.post('/:email/reputation/deduct', verifyAuth, userController.deductReputation);
router.patch('/:email/ban', verifyAuth, userController.toggleBan);

module.exports = router;
