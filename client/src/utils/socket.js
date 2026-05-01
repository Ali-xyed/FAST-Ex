import { io } from 'socket.io-client';

// Connect to API Gateway for all services including WebSocket
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    
    console.log('Initializing socket connection to API Gateway:', SOCKET_URL);
    
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      withCredentials: true,
      autoConnect: true,
      forceNew: false,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected to API Gateway! ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
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
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId) => {
  const socketInstance = getSocket();
  console.log('📥 Joining chat room:', chatId);
  socketInstance.emit('join_chat', chatId);
};

export const leaveChat = (chatId) => {
  const socketInstance = getSocket();
  console.log('📤 Leaving chat room:', chatId);
  socketInstance.emit('leave_chat', chatId);
};

export const onNewMessage = (callback) => {
  const socketInstance = getSocket();
  console.log('👂 Setting up new_message listener');
  socketInstance.on('new_message', (message) => {
    console.log('📨 Received new message:', message);
    callback(message);
  });
};

export const offNewMessage = () => {
  const socketInstance = getSocket();
  console.log('🔇 Removing new_message listener');
  socketInstance.off('new_message');
};
