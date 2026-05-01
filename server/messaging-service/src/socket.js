let ioInstance;

const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('[Messaging Service] User connected:', socket.id);

    socket.on('join_chat', (chatId) => {
      console.log(`[Messaging Service] Socket ${socket.id} joined room ${chatId}`);
      socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
      console.log(`[Messaging Service] Socket ${socket.id} left room ${chatId}`);
      socket.leave(chatId);
    });

    socket.on('disconnect', () => {
      console.log('[Messaging Service] User disconnected:', socket.id);
    });
  });
};

const getIo = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

module.exports = { initSocket, getIo };
