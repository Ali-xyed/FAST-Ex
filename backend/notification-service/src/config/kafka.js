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
    'bargain.accepted',
    'bargain.declined',
    'bargain.received',
    'listing.requested',
    'reputation.updated',
    'comment.posted',
    'exchange.received',
    'exchange.accepted',
    'exchange.declined'
  ];

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`[Kafka] Received event: ${topic}`, data);
      let notifData = null;

      if (topic === 'bargain.received') {
        notifData = { 
          to: data.toEmail, 
          from: data.fromEmail, 
          content: `New bargain of ${data.price} received`, 
          type: 'bargain_received',
          listingId: data.listingId,
          bargainId: data.bargainId
        };
      } else if (topic === 'bargain.accepted') {
        notifData = { 
          to: data.fromEmail, 
          from: data.toEmail, 
          content: 'Your bargain was accepted!', 
          type: 'bargain_accepted',
          listingId: data.listingId,
          bargainId: data.bargainId
        };
      } else if (topic === 'bargain.declined') {
        notifData = { 
          to: data.fromEmail, 
          from: data.toEmail, 
          content: 'Your bargain was declined', 
          type: 'bargain_declined',
          listingId: data.listingId,
          bargainId: data.bargainId
        };
      } else if (topic === 'listing.requested') {
        notifData = { 
          to: data.ownerEmail, 
          from: data.requesterEmail, 
          content: `Someone requested your listing "${data.listingTitle}"`, 
          type: 'listing_requested',
          listingId: data.listingId
        };
      } else if (topic === 'reputation.updated') {
        notifData = { 
          to: data.email, 
          from: 'system', 
          content: `Your reputation was updated by ${data.change > 0 ? '+' : ''}${data.change} points`, 
          type: 'reputation_updated'
        };
      } else if (topic === 'comment.posted') {
        notifData = { 
          to: data.ownerEmail, 
          from: data.fromEmail, 
          content: `New comment on your listing: "${data.content}"`, 
          type: 'comment_posted',
          listingId: data.listingId
        };
      } else if (topic === 'exchange.received') {
        notifData = { 
          to: data.toEmail, 
          from: data.fromEmail, 
          content: `New exchange request for "${data.listingTitle}"`, 
          type: 'exchange_received',
          listingId: data.listingId,
          exchangeId: data.exchangeId,
          offerTitle: data.offerTitle,
          offerDescription: data.offerDescription,
          offerImageUrl: data.offerImageUrl
        };
      } else if (topic === 'exchange.accepted') {
        notifData = { 
          to: data.fromEmail, 
          from: data.toEmail, 
          content: 'Your exchange request was accepted!', 
          type: 'exchange_accepted',
          listingId: data.listingId,
          exchangeId: data.exchangeId
        };
      } else if (topic === 'exchange.declined') {
        notifData = { 
          to: data.fromEmail, 
          from: data.toEmail, 
          content: 'Your exchange request was declined', 
          type: 'exchange_declined',
          listingId: data.listingId,
          exchangeId: data.exchangeId
        };
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
