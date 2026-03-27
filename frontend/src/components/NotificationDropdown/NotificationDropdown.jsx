import { useEffect, useState } from 'react';
import { notificationAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="absolute right-0 top-14 w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-gray-400">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium text-gray-400">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{notification.message}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
