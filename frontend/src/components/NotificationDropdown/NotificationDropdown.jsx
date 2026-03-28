import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
      return '0 min ago';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'bargain_accepted':
      case 'exchange_accepted':
        return { bg: 'bg-green-50/50', dot: 'bg-green-500', border: 'border-green-200' };
      case 'bargain_declined':
      case 'exchange_declined':
        return { bg: 'bg-red-50/50', dot: 'bg-red-500', border: 'border-red-200' };
      case 'bargain_received':
      case 'exchange_received':
        return { bg: 'bg-blue-50/50', dot: 'bg-blue-500', border: 'border-blue-200' };
      case 'listing_requested':
        return { bg: 'bg-purple-50/50', dot: 'bg-purple-500', border: 'border-purple-200' };
      case 'comment_posted':
        return { bg: 'bg-yellow-50/50', dot: 'bg-yellow-500', border: 'border-yellow-200' };
      case 'reputation_updated':
        return { bg: 'bg-gray-50/50', dot: 'bg-gray-500', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-50/50', dot: 'bg-gray-500', border: 'border-gray-200' };
    }
  };

  const getNotificationAction = (notification) => {
    const { type, from, listingId, bargainId, exchangeId } = notification;

    switch (type) {
      case 'bargain_accepted':
        return {
          label: 'Message them',
          icon: '→',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my bargain offer! When can we proceed with the transaction?')}`);
            onClose();
          }
        };

      case 'exchange_accepted':
        return {
          label: 'Message them',
          icon: '→',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my exchange request! When can we meet to exchange the items?')}`);
            onClose();
          }
        };

      case 'listing_requested':
        return {
          label: 'Message them',
          icon: '→',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Hi! I saw your interest in my listing. How can I help you?')}`);
            onClose();
          }
        };

      case 'bargain_declined':
      case 'exchange_declined':
        return null; // No action button

      case 'bargain_received':
        return {
          label: 'Get Info',
          icon: 'ℹ',
          onClick: () => {
            if (bargainId) {
              navigate(`/bargain-offers?bargainId=${bargainId}`);
            } else {
              navigate('/bargain-offers');
            }
            onClose();
          }
        };

      case 'exchange_received':
        return {
          label: 'Get Info',
          icon: 'ℹ',
          onClick: () => {
            if (exchangeId) {
              navigate(`/exchange-requests?exchangeId=${exchangeId}`);
            } else {
              navigate('/exchange-requests');
            }
            onClose();
          }
        };

      case 'comment_posted':
        return {
          label: 'View Comments',
          icon: '💬',
          onClick: () => {
            if (listingId) {
              navigate(`/listing/${listingId}`);
              onClose();
            }
          }
        };

      case 'reputation_updated':
        return null; // No action button

      default:
        return {
          label: 'Message them',
          icon: '→',
          onClick: () => {
            navigate(`/messages?user=${from}`);
            onClose();
          }
        };
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      notificationAPI.markAllAsRead().catch(() => {});
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
    <div className="absolute right-0 top-14 w-[420px] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="p-4 border-b-2 border-gray-200 flex items-center justify-between">
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

      <div 
        className="overflow-y-auto"
        style={{ 
          maxHeight: '400px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#9CA3AF #F3F4F6'
        }}
      >
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
          notifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            const action = getNotificationAction(notification);
            
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b ${style.border} hover:bg-gray-50 transition-colors ${!notification.isRead ? style.bg : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.isRead ? style.dot : 'bg-gray-300'}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-gray-900 truncate">{notification.from}</p>
                      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider flex-shrink-0 ml-2">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-700 font-medium mb-2">
                      {notification.content}
                    </p>
                    {action && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                      >
                        {action.label} {action.icon}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
