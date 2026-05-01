import { io } from 'socket.io-client';

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
    });

    socket.on('disconnect', (reason) => {
    });

    socket.on('connect_error', (error) => {
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
    });

    socket.on('reconnect', (attemptNumber) => {
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
  socketInstance.emit('join_chat', chatId);
};

export const leaveChat = (chatId) => {
  const socketInstance = getSocket();
  socketInstance.emit('leave_chat', chatId);
};

export const onNewMessage = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('new_message', (message) => {
    callback(message);
  });
};

export const offNewMessage = () => {
  const socketInstance = getSocket();
  socketInstance.off('new_message');
};
