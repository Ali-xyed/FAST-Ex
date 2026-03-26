const amqplib = require('amqplib');

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('email.request', { durable: true });
    await channel.assertQueue('email.approve', { durable: true });
    console.log('Listing service connected to RabbitMQ');
  } catch (err) {
    console.error('Failed to connect RabbitMQ (listing-service)', err);
  }
};

const publishMessage = (queue, message) => {
  if (channel) {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  }
};

module.exports = { connectRabbitMQ, publishMessage };
