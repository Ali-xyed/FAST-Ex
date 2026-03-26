const { Kafka } = require('kafkajs');
const userRepo = require('../repositories/user.repository');

const kafka = new Kafka({
  clientId: 'user-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'user-service-group' });

const connectKafkaConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka Consumer connected (user-service)');

    await consumer.subscribe({ topic: 'user.registered', fromBeginning: true });
    await consumer.subscribe({ topic: 'reputation.updated', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value.toString());

        if (topic === 'user.registered') {
          await userRepo.upsertUser(data.email, data.name || '', data.rollNo || '');
          console.log(`Created profile for ${data.email}`);
        }
        if (topic === 'reputation.updated') {
          await userRepo.updateReputation(data.email, data.change).catch(console.error);
        }
      }
    });
  } catch (error) {
    console.error('Kafka Consumer Error', error);
  }
};

module.exports = { connectKafkaConsumer };
