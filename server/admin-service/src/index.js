require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const adminRoutes = require('./routes/admin.routes');
const { connectKafkaProducer } = require('./config/kafka');
const { connectRabbitMQ } = require('./config/rabbitmq');

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

app.use('/api/admin', adminRoutes);

const PORT = process.env.ADMIN_PORT || 5007;

app.listen(PORT, async () => {
  await connectKafkaProducer();
  await connectRabbitMQ();
  console.log(`Admin service running on port ${PORT}`);
});
