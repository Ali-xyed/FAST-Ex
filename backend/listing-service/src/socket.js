let ioInstance;

const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log('User connected to listing-service', socket.id);

    socket.on('join_listing', (listingId) => {
      socket.join(listingId);
    });

    socket.on('disconnect', () => {});
  });
};

const getIo = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

module.exports = { initSocket, getIo };
