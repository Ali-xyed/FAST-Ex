const express = require('express');
const messagingController = require('../controllers/messaging.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/chats', verifyAuth, messagingController.getChats);
router.post('/chats', verifyAuth, messagingController.createOrGetChat);

router.get('/chats/:chatId', verifyAuth, messagingController.getChatById);
router.post('/chats/:chatId', verifyAuth, messagingController.sendMessage);

module.exports = router;
