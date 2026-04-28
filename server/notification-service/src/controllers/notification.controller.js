const notificationRepo = require('../repositories/notification.repository');

const getMyNotifications = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const notifs = await notificationRepo.getUserNotifications(email);
    res.status(200).json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    await notificationRepo.markAllAsRead(email);
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyNotifications, markAllRead };
