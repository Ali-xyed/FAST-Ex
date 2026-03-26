require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.MESSAGING_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const msgRoutes = require('./routes/messaging.routes');
const { connectKafkaProducer } = require('./config/kafka');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/messages', msgRoutes);

const PORT = process.env.MESSAGE_PORT || 5005;

const io = new Server(server, { cors: { origin: '*' } });
initSocket(io);

server.listen(PORT, async () => {
  connectKafkaProducer();
  console.log(`Messaging service running on port ${PORT}`);
});
