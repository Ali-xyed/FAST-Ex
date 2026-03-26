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

app.use(cors());
app.use(express.json());

app.use('/api/notifications', notifRoutes);

const PORT = process.env.NOTIFICATION_PORT || 5006;

const io = new Server(server, { cors: { origin: '*' } });
initSocket(io);
setIoRef(io);

server.listen(PORT, async () => {
  connectKafkaConsumer();
  connectRabbitMQConsumer();
  console.log(`Notification service (HTTP + Socket.IO) running on port ${PORT}`);
});
