require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.LISTING_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const listingRoutes = require('./routes/listing.routes');
const { connectKafkaProducer, connectKafkaConsumer, subscribeToTopic } = require('./config/kafka');
const { initSocket } = require('./socket');
const { connectRabbitMQ } = require('./config/rabbitmq');
const listingRepository = require('./repositories/listing.repository');

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

app.use('/api/listings', listingRoutes);

const PORT = process.env.LISTING_PORT || 5004;

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
    
    // Delete all listings, comments, bargains, and exchanges by this user
    await listingRepository.deleteAllListingsByUser(email);
    await listingRepository.deleteAllCommentsByUser(email);
    await listingRepository.deleteAllBargainsByUser(email);
    await listingRepository.deleteAllExchangesByUser(email);
    
    console.log(`Successfully cleaned up all listing data for user: ${email}`);
  } catch (error) {
    console.error('Error handling user.deleted event:', error);
  }
};

server.listen(PORT, async () => {
  await connectKafkaProducer();
  await connectKafkaConsumer();
  await subscribeToTopic('user.deleted', handleUserDeleted);
  connectRabbitMQ();
  console.log(`Listing service running on port ${PORT}`);
});
