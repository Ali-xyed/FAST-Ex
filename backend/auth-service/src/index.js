require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.AUTH_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { connectKafka } = require('./config/kafka');
const { connectRabbitMQ } = require('./config/rabbitmq');
const authRepo = require('./repositories/auth.repository');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5002;

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
