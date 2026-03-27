require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.AUTH_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { connectKafka } = require('./config/kafka');
const { connectRabbitMQ } = require('./config/rabbitmq');
const authRepo = require('./repositories/auth.repository');

const app = express();

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
app.use('/api/auth', authRoutes);

const PORT = process.env.AUTH_PORT || 5002;

app.listen(PORT, async () => {
  connectKafka();
  connectRabbitMQ();

  setInterval(async () => {
    try {
      const result = await authRepo.deleteExpiredOTPs();
      if (result.count > 0) console.log(`Cleaned ${result.count} expired OTPs`);
    } catch (err) {
      console.error('OTP cleanup error:', err.message);
    }
  }, 60 * 60 * 1000);

  console.log(`Auth service running on port ${PORT}`);
});
