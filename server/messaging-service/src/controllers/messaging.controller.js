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
    const { otherUserEmail, initialMessage, listingReference } = req.body;

    if (!email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!otherUserEmail) {
      return res.status(400).json({ message: 'Other user email is required' });
    }

    console.log(`[MESSAGING] Creating/getting chat between ${email} and ${otherUserEmail}`);

    let chat = await messagingRepo.findChatBetweenUsers(email, otherUserEmail);
    let isNewChat = false;
    
    if (!chat) {
      console.log(`[MESSAGING] Creating new chat`);
      chat = await messagingRepo.createChat(email, otherUserEmail);
      isNewChat = true;
    } else {
      console.log(`[MESSAGING] Chat already exists: ${chat.id}`);
    }

    // If this is a new chat and we have an initial message, send it
    if (isNewChat && initialMessage) {
      console.log(`[MESSAGING] Sending initial message`);
      const message = await messagingRepo.createMessage(
        chat.id, 
        email, 
        otherUserEmail, 
        initialMessage,
        listingReference
      );

      // Send notification event
      try {
        await sendEvent('message.sent', { 
          chatId: chat.id, 
          senderId: email, 
          receiverId: otherUserEmail, 
          content: initialMessage,
          listingReference 
        });
      } catch (kafkaErr) {
        console.error('[MESSAGING] Kafka error:', kafkaErr.message);
      }

      // Emit via WebSocket
      try {
        const { getIo } = require('../socket');
        getIo().to(chat.id).emit('new_message', message);
      } catch (err) {
        console.error('[MESSAGING] WebSocket Error:', err.message);
      }
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error('[MESSAGING] Error in createOrGetChat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const { content, listingReference } = req.body;

    const chat = await messagingRepo.findChatById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const receiver = chat.user1 === email ? chat.user2 : chat.user1;
    const message = await messagingRepo.createMessage(chatId, email, receiver, content, listingReference);

    await sendEvent('message.sent', { 
      chatId, 
      senderId: email, 
      receiverId: receiver, 
      content,
      listingReference 
    });

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
