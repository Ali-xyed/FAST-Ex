require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.LISTING_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const listingRoutes = require('./routes/listing.routes');
const { connectKafkaProducer } = require('./config/kafka');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/listings', listingRoutes);

const PORT = process.env.PORT || 5004;

const io = new Server(server, { cors: { origin: '*' } });
initSocket(io);

server.listen(PORT, async () => {
  connectKafkaProducer();
  console.log(`Listing service running on port ${PORT}`);
});
