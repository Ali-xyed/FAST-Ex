require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.NOTIFICATION_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const notifRoutes = require('./routes/notification.routes');
const { connectKafkaConsumer, setIoRef } = require('./config/kafka');
const { connectRabbitMQConsumer } = require('./config/rabbitmq');
const { initSocket } = require('./socket');

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

app.use('/api/notifications', notifRoutes);

const PORT = process.env.NOTIFICATION_PORT || 5006;

const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  } 
});
initSocket(io);
setIoRef(io);

server.listen(PORT, async () => {
  connectKafkaConsumer();
  connectRabbitMQConsumer();
  console.log(`Notification service (HTTP + Socket.IO) running on port ${PORT}`);
});
