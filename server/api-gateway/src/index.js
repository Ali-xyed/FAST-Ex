require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL?.trim().replace(/\/$/, ""),
  "http://localhost:5173",
  "http://localhost"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-User-Email', 'X-User-Role', 'X-Forwarded-For'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use('/', routes);

// Setup Socket.IO server on API Gateway
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

// Connect to messaging service Socket.IO server
const MESSAGE_SERVICE_URL = process.env.MESSAGE_SERVICE_URL || 'http://localhost:5005';
console.log('[API Gateway] Connecting to messaging service at:', MESSAGE_SERVICE_URL);

const messagingSocket = ioClient(MESSAGE_SERVICE_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

messagingSocket.on('connect', () => {
  console.log('[API Gateway] Connected to messaging service');
});

messagingSocket.on('disconnect', () => {
  console.log('[API Gateway] Disconnected from messaging service');
});

messagingSocket.on('connect_error', (error) => {
  console.error('[API Gateway] Messaging service connection error:', error.message);
});

// Map to track client sockets and their joined rooms
const clientRooms = new Map();

// Handle client connections
io.on('connection', (clientSocket) => {
  console.log('[API Gateway] Client connected:', clientSocket.id);
  clientRooms.set(clientSocket.id, new Set());

  // Forward join_chat to messaging service
  clientSocket.on('join_chat', (chatId) => {
    console.log(`[API Gateway] Client ${clientSocket.id} joining chat: ${chatId}`);
    
    // Track which rooms this client is in
    clientRooms.get(clientSocket.id).add(chatId);
    
    // Join the client to a local room
    clientSocket.join(chatId);
    
    // Forward to messaging service
    messagingSocket.emit('join_chat', chatId);
  });

  // Forward leave_chat to messaging service
  clientSocket.on('leave_chat', (chatId) => {
    console.log(`[API Gateway] Client ${clientSocket.id} leaving chat: ${chatId}`);
    
    // Remove from tracked rooms
    clientRooms.get(clientSocket.id)?.delete(chatId);
    
    // Leave the local room
    clientSocket.leave(chatId);
    
    // Forward to messaging service
    messagingSocket.emit('leave_chat', chatId);
  });

  // Handle client disconnection
  clientSocket.on('disconnect', () => {
    console.log('[API Gateway] Client disconnected:', clientSocket.id);
    
    // Clean up tracked rooms
    const rooms = clientRooms.get(clientSocket.id);
    if (rooms) {
      rooms.forEach(chatId => {
        messagingSocket.emit('leave_chat', chatId);
      });
      clientRooms.delete(clientSocket.id);
    }
  });
});

// Listen for new_message events from messaging service and broadcast to clients
messagingSocket.on('new_message', (message) => {
  console.log('[API Gateway] Received new_message from messaging service:', message.chatId);
  
  // Broadcast to all clients in that chat room
  io.to(message.chatId).emit('new_message', message);
  console.log('[API Gateway] Broadcasted new_message to room:', message.chatId);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API Gateway running on port ${PORT} with WebSocket support`));
