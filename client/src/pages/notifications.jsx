import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { notificationAPI } from '../utils/api';
import toast from 'react-hot-toast';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to load notifications');
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
        return { bg: 'bg-green-50', dot: 'bg-green-500', border: 'border-green-200' };
      case 'bargain_declined':
      case 'exchange_declined':
        return { bg: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200' };
      case 'bargain_received':
      case 'exchange_received':
        return { bg: 'bg-blue-50', dot: 'bg-blue-500', border: 'border-blue-200' };
      case 'listing_requested':
        return { bg: 'bg-purple-50', dot: 'bg-purple-500', border: 'border-purple-200' };
      case 'comment_posted':
        return { bg: 'bg-yellow-50', dot: 'bg-yellow-500', border: 'border-yellow-200' };
      case 'reputation_updated':
        return { bg: 'bg-gray-50', dot: 'bg-gray-500', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-50', dot: 'bg-gray-500', border: 'border-gray-200' };
    }
  };

  const getNotificationAction = (notification) => {
    const { type, from, listingId, bargainId, exchangeId } = notification;

    switch (type) {
      case 'bargain_accepted':
        return {
          label: 'Message them',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my bargain offer! When can we proceed with the transaction?')}`);
          }
        };

      case 'exchange_accepted':
        return {
          label: 'Message them',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my exchange request! When can we meet to exchange the items?')}`);
          }
        };

      case 'listing_requested':
        return {
          label: 'Message them',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Hi! I saw your interest in my listing. How can I help you?')}`);
          }
        };

      case 'bargain_declined':
      case 'exchange_declined':
        return null;

      case 'bargain_received':
        return {
          label: 'Get Info',
          onClick: () => {
            if (bargainId) {
              navigate(`/bargain-offers?bargainId=${bargainId}`);
            } else {
              navigate('/bargain-offers');
            }
          }
        };

      case 'exchange_received':
        return {
          label: 'Get Info',
          onClick: () => {
            if (exchangeId) {
              navigate(`/exchange-requests?exchangeId=${exchangeId}`);
            } else {
              navigate('/exchange-requests');
            }
          }
        };

      case 'comment_posted':
        return {
          label: 'View Comments',
          onClick: () => {
            if (listingId) {
              navigate(`/listing/${listingId}`);
            }
          }
        };

      case 'reputation_updated':
        return null;

      default:
        return {
          label: 'Message them',
          onClick: () => {
            navigate(`/messages?user=${from}`);
          }
        };
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

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      notificationAPI.markAllAsRead().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black tracking-tight">All Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm font-bold text-gray-600 hover:text-black uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center">
            <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-400 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const style = getNotificationStyle(notification.type);
              const action = getNotificationAction(notification);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white border-2 ${style.border} rounded-2xl p-6 hover:shadow-md transition-all ${!notification.isRead ? style.bg : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${!notification.isRead ? style.dot : 'bg-gray-300'}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-black text-gray-900">{notification.from}</p>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex-shrink-0 ml-4">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 font-medium mb-3">
                        {notification.content}
                      </p>
                      {action && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          {action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default NotificationsPage;
