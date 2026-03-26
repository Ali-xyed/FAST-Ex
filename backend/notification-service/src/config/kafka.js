const { Kafka } = require('kafkajs');
const notificationRepo = require('../repositories/notification.repository');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

let ioRef = null;

const setIoRef = (io) => {
  ioRef = io;
};

const connectKafkaConsumer = async () => {
  await consumer.connect();
  console.log('Notification Service connected to Kafka');

  const topics = [
    'bargain.submitted',
    'bargain.accepted',
    'bargain.declined',
    'listing.requested'
  ];

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Kafka] Received event: ${topic}`, data);
      let notifData = null;

      if (topic === 'bargain.submitted') {
        notifData = { to: data.toEmail, from: data.fromEmail, content: `New bargain of ${data.price} received` };
      } else if (topic === 'bargain.accepted') {
        notifData = { to: data.fromEmail, from: data.toEmail, content: 'Your bargain was accepted!' };
      } else if (topic === 'bargain.declined') {
        notifData = { to: data.fromEmail, from: data.toEmail, content: 'Your bargain was declined' };
      } else if (topic === 'listing.requested') {
        notifData = { to: data.ownerEmail, from: data.requesterEmail, content: `Someone requested your listing "${data.listingTitle}"` };
      }

      if (notifData) {
        const saved = await notificationRepo.createNotification(notifData);
        if (ioRef) {
          ioRef.to(notifData.to).emit('new_notification', saved);
        }
      }
    }
  });
};

module.exports = { connectKafkaConsumer, setIoRef };
