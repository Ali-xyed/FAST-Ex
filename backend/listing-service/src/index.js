require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.LISTING_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const listingRoutes = require('./routes/listing.routes');
const { connectKafkaProducer } = require('./config/kafka');
const { initSocket } = require('./socket');
const { connectRabbitMQ } = require('./config/rabbitmq');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL?.trim().replace(/\/$/, ""),
  "http://localhost:5173"
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

server.listen(PORT, async () => {
  connectKafkaProducer();
  connectRabbitMQ();
  console.log(`Listing service running on port ${PORT}`);
});
