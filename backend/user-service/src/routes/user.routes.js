const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyAuth } = require('../middleware/auth.middleware');
const upload = require('../config/s3');

const router = express.Router();

router.get('/profile', verifyAuth, userController.getProfile);
router.put('/profile', verifyAuth, userController.updateProfile);
router.post('/profile/image', verifyAuth, upload.single('image'), userController.uploadImage);

router.get('/:email', verifyAuth, userController.getPublicProfile);
router.get('/:email/reputation', verifyAuth, userController.getReputation);
router.patch('/:email/ban', verifyAuth, userController.toggleBan);

module.exports = router;
