const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'admin-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const connectKafkaProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected (admin-service)');
  } catch (error) {
    console.error('Failed to connect Kafka Producer', error);
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

module.exports = { connectKafkaProducer, sendEvent };
