const amqplib = require('amqplib');

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('email.otp', { durable: true });
    await channel.assertQueue('email.account.status', { durable: true });
    console.log('RabbitMQ connected (auth-service)');
  } catch (err) {
    console.error('Failed to connect RabbitMQ (auth-service)', err);
  }
};

const publishMessage = (queue, data) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized');
    return;
  }
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
};

module.exports = { connectRabbitMQ, publishMessage };
