import { io } from 'socket.io-client';

// For production, the socket might be on a different URL or port
// Try connecting directly to the messaging service
const SOCKET_URL = 'https://web-backend.duckdns.org';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    
    console.log('🔌 Initializing socket connection to:', SOCKET_URL);
    
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        token,
      },
      transports: ['polling', 'websocket'], // Try polling first
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      withCredentials: true,
      autoConnect: true,
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully! ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      console.error('Error details:', error);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId) => {
  const socketInstance = getSocket();
  socketInstance.emit('join_chat', chatId);
  console.log('Joined chat room:', chatId);
};

export const leaveChat = (chatId) => {
  const socketInstance = getSocket();
  socketInstance.emit('leave_chat', chatId);
  console.log('Left chat room:', chatId);
};

export const onNewMessage = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('new_message', callback);
};

export const offNewMessage = () => {
  const socketInstance = getSocket();
  socketInstance.off('new_message');
};
