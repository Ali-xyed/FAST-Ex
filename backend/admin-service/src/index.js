require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const adminRoutes = require('./routes/admin.routes');
const { connectKafkaProducer } = require('./config/kafka');
const { connectRabbitMQ } = require('./config/rabbitmq');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5007;

app.listen(PORT, async () => {
  await connectKafkaProducer();
  await connectRabbitMQ();
  console.log(`Admin service running on port ${PORT}`);
});
