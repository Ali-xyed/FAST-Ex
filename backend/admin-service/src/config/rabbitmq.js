const amqplib = require('amqplib');

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('email.banned', { durable: true });
    console.log('RabbitMQ connected (admin-service)');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ from admin-service', err);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel };
