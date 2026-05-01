require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.AUTH_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { connectKafka, connectKafkaConsumer, subscribeToTopic } = require('./config/kafka');
const { connectRabbitMQ } = require('./config/rabbitmq');
const authRepo = require('./repositories/auth.repository');

const app = express();

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
app.use('/api/auth', authRoutes);

const PORT = process.env.AUTH_PORT || 5002;

const handleUserDeleted = async (data) => {
  try {
    const { email } = data;
    console.log(`Received user.deleted event for: ${email}`);
    
    await authRepo.deleteUser(email);
    
    console.log(`Successfully deleted user from auth database: ${email}`);
  } catch (error) {
    console.error('Error handling user.deleted event:', error);
  }
};

const handleReputationUpdated = async (data) => {
  try {
    const { email, change } = data;
    console.log(`[Auth Service] Received reputation.updated event for: ${email}, change: ${change}`);
    
    await authRepo.updateReputation(email, change);
    
    console.log(`[Auth Service] Successfully updated reputation for ${email}: ${change > 0 ? '+' : ''}${change}`);
  } catch (error) {
    console.error('[Auth Service] Error handling reputation.updated event:', error);
  }
};

app.listen(PORT, async () => {
  await connectKafka();
  await connectKafkaConsumer();
  await subscribeToTopic('user.deleted', handleUserDeleted);
  await subscribeToTopic('reputation.updated', handleReputationUpdated);
  connectRabbitMQ();

  setInterval(async () => {
    try {
      const result = await authRepo.deleteExpiredOTPs();
      if (result.count > 0) console.log(`[OTP Cleanup] Removed ${result.count} expired OTPs`);
    } catch (err) {
      console.error('[OTP Cleanup] Error:', err.message);
    }
  }, 10 * 60 * 1000);

  console.log(`Auth service running on port ${PORT}`);
  console.log(`OTP cleanup scheduled every 10 minutes`);
});
