require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.USER_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const userRoutes = require('./routes/user.routes');
const { connectKafkaConsumer, sendEvent } = require('./config/kafka');
const userRepo = require('./repositories/user.repository');
const prisma = require('./config/prisma');

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
app.use('/api/users', userRoutes);

const PORT = process.env.USER_PORT || 5003;

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[CRON] Running daily reputation bonus...');
    
    const users = await prisma.userProfile.findMany({
      where: { isBan: false }
    });
    
    let successCount = 0;
    for (const user of users) {
      try {
        await userRepo.updateReputation(user.email, 5);
        await sendEvent('reputation.updated', { email: user.email, change: 5 });
        successCount++;
      } catch (err) {
        console.error(`[CRON] Failed to give daily bonus to ${user.email}:`, err.message);
      }
    }
    
    console.log(`[CRON] Daily reputation bonus completed: ${successCount}/${users.length} users received +5 points`);
  } catch (error) {
    console.error('[CRON] Daily reputation bonus error:', error);
  }
}, {
  timezone: 'Asia/Karachi'
});

app.listen(PORT, async () => {
  connectKafkaConsumer();
  console.log(`User service running on port ${PORT}`);
  console.log('[CRON] Daily reputation bonus scheduled (runs at midnight PKT - Asia/Karachi)');
});
