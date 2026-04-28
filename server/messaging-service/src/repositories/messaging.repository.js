const prisma = require('../config/prisma');

class MessagingRepository {
  async findChatsForUser(email) {
    return prisma.chat.findMany({
      where: { OR: [{ user1: email }, { user2: email }] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  async findChatBetweenUsers(user1, user2) {
    return prisma.chat.findFirst({
      where: {
        OR: [
          { user1: user1, user2: user2 },
          { user1: user2, user2: user1 }
        ]
      }
    });
  }

  async createChat(user1, user2) {
    return prisma.chat.create({ data: { user1, user2 } });
  }

  async findChatById(id) {
    return prisma.chat.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  async createMessage(chatId, sender, receiver, content) {
    return prisma.message.create({
      data: { chatId, sender, receiver, content }
    });
  }
}

module.exports = new MessagingRepository();
