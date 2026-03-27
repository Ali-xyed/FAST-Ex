require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.USER_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const { connectKafkaConsumer } = require('./config/kafka');

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
app.use('/api/users', userRoutes);

const PORT = process.env.USER_PORT || 5003;

app.listen(PORT, async () => {
  connectKafkaConsumer();
  console.log(`User service running on port ${PORT}`);
});
