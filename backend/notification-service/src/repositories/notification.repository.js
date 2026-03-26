const prisma = require('../config/prisma');

class NotificationRepository {
  async getUserNotifications(email) {
    return prisma.notification.findMany({
      where: { to: email },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markAllAsRead(email) {
    return prisma.notification.updateMany({
      where: { to: email, isRead: false },
      data: { isRead: true }
    });
  }

  async createNotification(data) {
    return prisma.notification.create({ data });
  }
}

module.exports = new NotificationRepository();
