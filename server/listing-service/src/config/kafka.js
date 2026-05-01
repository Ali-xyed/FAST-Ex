const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'listing-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'listing-service-group' });

const connectKafkaProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected (listing-service)');
  } catch (error) {
    console.error('Failed to connect Kafka Producer', error);
  }
};

const connectKafkaConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka Consumer connected (listing-service)');
  } catch (error) {
    console.error('Failed to connect Kafka Consumer', error);
  }
};

const subscribeToTopic = async (topic, handler) => {
  try {
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          await handler(data);
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
        }
      }
    });
    console.log(`Subscribed to Kafka topic: ${topic}`);
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topic}:`, error);
  }
};

const sendEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    console.error(`Failed to send Kafka event to ${topic}`, error);
  }
};

module.exports = { connectKafkaProducer, connectKafkaConsumer, subscribeToTopic, sendEvent };
