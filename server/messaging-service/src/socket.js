let ioInstance;

const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('User connected to messaging-service', socket.id);

    socket.on('join_chat', (chatId) => {
      console.log(`User ${socket.id} joined room ${chatId}`);
      socket.join(chatId);
    });

    socket.on('disconnect', () => {});
  });
};

const getIo = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

module.exports = { initSocket, getIo };
