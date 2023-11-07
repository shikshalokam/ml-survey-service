//dependencies
const kafka = require("kafka-node");
const SUBMISSION_RATING_QUEUE_TOPIC = process.env.SUBMISSION_RATING_QUEUE_TOPIC;
const USER_DELETE_TOPIC = process.env.USER_DELETE_TOPIC;
var connect = function () {
  Producer = kafka.Producer;
  KeyedMessage = kafka.KeyedMessage;
  client = new kafka.KafkaClient({
    kafkaHost: process.env.KAFKA_URL,
  });

  client.on("error", function (error) {
    console.error.bind(console, "kafka connection error!");
  });

  producer = new Producer(client);

  producer.on("ready", function () {
    console.log("Connected to Kafka");
  });

  producer.on("error", function (err) {
    console.error.bind(console, "kafka producer creation error!");
  });

  if (SUBMISSION_RATING_QUEUE_TOPIC && SUBMISSION_RATING_QUEUE_TOPIC != "OFF") {
    _sendToKafkaConsumers(SUBMISSION_RATING_QUEUE_TOPIC, process.env.KAFKA_URL);
  }
  _sendToKafkaConsumers(USER_DELETE_TOPIC, process.env.KAFKA_URL);

  return {
    kafkaProducer: producer,
    kafkaClient: client,
    kafkaKeyedMessage: KeyedMessage,
  };
};

/**
 * Send data based on topic to kafka consumers
 * @function
 * @name _sendToKafkaConsumers
 * @param {String} topic - name of kafka topic.
 * @param {String} host - kafka host
 */

var _sendToKafkaConsumers = function (topic, host) {
  if (topic && topic != "") {
    let consumer = new kafka.ConsumerGroup(
      {
        kafkaHost: host,
        groupId: process.env.KAFKA_GROUP_ID,
        autoCommit: true,
      },
      topic
    );

    consumer.on("message", async function (message) {
      console.log("-------Kafka consumer log starts here------------------");
      console.log("Topic Name: ", topic);
      console.log("Message: ", JSON.stringify(message));
      console.log("-------Kafka consumer log ends here------------------");

      if (message && message.topic === SUBMISSION_RATING_QUEUE_TOPIC) {
        submissionRatingQueueConsumer.messageReceived(message);
      }
      // call userDMSConsumer
      if (message && message.topic === USER_DELETE_TOPIC) {
        userDMSConsumer.messageReceived(message);
      }
    });

    consumer.on("error", async function (error) {
      if (error.topics && error.topics[0] === SUBMISSION_RATING_QUEUE_TOPIC) {
        submissionRatingQueueConsumer.errorTriggered(error);
      }
      if (error.topics && error.topics[0] === USER_DELETE_TOPIC) {
        userDMSConsumer.errorTriggered(error);
      }
    });
  }
};

module.exports = connect;
