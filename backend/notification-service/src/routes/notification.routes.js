const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification' }));

router.get('/', verifyAuth, notificationController.getMyNotifications);
router.patch('/read-all', verifyAuth, notificationController.markAllRead);

module.exports = router;
