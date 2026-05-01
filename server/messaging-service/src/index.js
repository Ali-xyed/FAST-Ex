require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.MESSAGING_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const msgRoutes = require('./routes/messaging.routes');
const { connectKafkaProducer, connectKafkaConsumer, subscribeToTopic } = require('./config/kafka');
const { initSocket } = require('./socket');
const messagingRepository = require('./repositories/messaging.repository');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL?.trim().replace(/\/$/, ""),
  process.env.GATEWAY_URL?.trim().replace(/\/$/, ""),
  "http://localhost:5173",
  "http://localhost",
  "http://localhost:5000"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-User-Email', 'X-User-Role'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/messages', msgRoutes);

const PORT = process.env.MESSAGE_PORT || 5005;

const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  } 
});
initSocket(io);

// Kafka event handler for user deletion
const handleUserDeleted = async (data) => {
  try {
    const { email } = data;
    console.log(`Received user.deleted event for: ${email}`);
    
    // Delete all messages and chats for this user
    await messagingRepository.deleteAllMessagesForUser(email);
    
    console.log(`Successfully cleaned up all messaging data for user: ${email}`);
  } catch (error) {
    console.error('Error handling user.deleted event:', error);
  }
};

server.listen(PORT, async () => {
  await connectKafkaProducer();
  await connectKafkaConsumer();
  await subscribeToTopic('user.deleted', handleUserDeleted);
  console.log(`Messaging service running on port ${PORT}`);
});
