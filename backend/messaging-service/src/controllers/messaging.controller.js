const messagingRepo = require('../repositories/messaging.repository');
const { sendEvent } = require('../config/kafka');
const { getIo } = require('../socket');

const getChats = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const chats = await messagingRepo.findChatsForUser(email);
    
    const axios = require('axios');
    const chatsWithProfiles = await Promise.all(
      chats.map(async (chat) => {
        const otherUserEmail = chat.user1 === email ? chat.user2 : chat.user1;
        try {
          const profileResponse = await axios.get(`${process.env.USER_SERVICE_URL}/api/users/public/${otherUserEmail}`);
          return {
            ...chat,
            otherUserEmail,
            otherUserName: profileResponse.data?.name || null,
            profileImageUrl: profileResponse.data?.imageUrl || null
          };
        } catch (err) {
          console.error(`Failed to fetch profile for ${otherUserEmail}:`, err.message);
          return {
            ...chat,
            otherUserEmail,
            otherUserName: null,
            profileImageUrl: null
          };
        }
      })
    );
    
    res.status(200).json(chatsWithProfiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
};

const createOrGetChat = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { otherUserEmail } = req.body;

    let chat = await messagingRepo.findChatBetweenUsers(email, otherUserEmail);
    if (!chat) chat = await messagingRepo.createChat(email, otherUserEmail);

    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await messagingRepo.findChatById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const { chatId } = req.params;
    const { content } = req.body;

    const chat = await messagingRepo.findChatById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const receiver = chat.user1 === email ? chat.user2 : chat.user1;
    const message = await messagingRepo.createMessage(chatId, email, receiver, content);

    await sendEvent('message.sent', { chatId, senderId: email, receiverId: receiver, content });

    try {
      const { getIo } = require('../socket');
      console.log(`Broadcasting new_message to room ${chatId}`);
      getIo().to(chatId).emit('new_message', message);
    } catch (err) {
      console.error('WebSocket Error:', err.message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getChats, createOrGetChat, getChatById, sendMessage };
