import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [searchQuery, setSearchQuery] = useState('');
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
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bargain_accepted':
      case 'exchange_accepted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'bargain_declined':
      case 'exchange_declined':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'bargain_received':
      case 'exchange_received':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'listing_requested':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'comment_posted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'reputation_updated':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'bargain_accepted':
      case 'exchange_accepted':
        return 'text-green-600 bg-green-50';
      case 'bargain_declined':
      case 'exchange_declined':
        return 'text-red-600 bg-red-50';
      case 'bargain_received':
      case 'exchange_received':
        return 'text-blue-600 bg-blue-50';
      case 'listing_requested':
        return 'text-purple-600 bg-purple-50';
      case 'comment_posted':
        return 'text-yellow-600 bg-yellow-50';
      case 'reputation_updated':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getNotificationAction = (notification) => {
    const { type, from, listingId, bargainId, exchangeId } = notification;

    switch (type) {
      case 'bargain_accepted':
        return {
          label: 'Message',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my bargain offer! When can we proceed with the transaction?')}`);
            onClose();
          }
        };

      case 'exchange_accepted':
        return {
          label: 'Message',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Thank you for accepting my exchange request! When can we meet to exchange the items?')}`);
            onClose();
          }
        };

      case 'listing_requested':
        return {
          label: 'Message',
          onClick: () => {
            navigate(`/messages?user=${from}&message=${encodeURIComponent('Hi! I saw your interest in my listing. How can I help you?')}`);
            onClose();
          }
        };

      case 'bargain_declined':
      case 'exchange_declined':
        return null;

      case 'bargain_received':
        return {
          label: 'View Offer',
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
          label: 'View Request',
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
          label: 'View',
          onClick: () => {
            if (listingId) {
              navigate(`/listing/${listingId}`);
              onClose();
            }
          }
        };

      case 'reputation_updated':
        return null;

      default:
        return {
          label: 'Message',
          onClick: () => {
            navigate(`/messages?user=${from}`);
            onClose();
          }
        };
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      notificationAPI.markAllAsRead().catch(() => {});
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || !n.isRead)
    .filter(n => 
      searchQuery === '' || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.from.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white text-black z-50 shadow-2xl animate-slideInRight flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black tracking-tight">Notifications</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors ${
                  filter === 'all' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors ${
                  filter === 'unread' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread
              </button>
              <div className="flex-1" />
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-wider"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search notifications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400 font-medium">Loading...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="w-20 h-20 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-400 font-medium">No notifications</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => {
                const action = getNotificationAction(notification);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white border-2 border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${
                      !notification.isRead ? 'border-blue-300 bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-black text-gray-900">
                            {notification.from}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 font-medium mb-3">
                          {notification.content}
                        </p>

                        {action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick();
                            }}
                            className="text-xs font-bold text-black hover:text-gray-600 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-gray-100"
                          >
                            {action.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NotificationDropdown;
