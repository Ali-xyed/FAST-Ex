require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.USER_DATABASE_URL;

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const { connectKafkaConsumer } = require('./config/kafka');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

const PORT = process.env.USER_PORT || 5003;

app.listen(PORT, async () => {
  connectKafkaConsumer();
  console.log(`User service running on port ${PORT}`);
});
