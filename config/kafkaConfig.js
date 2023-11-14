//dependencies
const kafka = require("kafka-node");

var connect = function () {
  Producer = kafka.Producer;
  KeyedMessage = kafka.KeyedMessage;
  const Consumer = kafka.Consumer;
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

  const Topics = [
    process.env.SUBMISSION_RATING_QUEUE_TOPIC,
    process.env.USER_DELETE_TOPIC,
  ];

  let consumer = new kafka.ConsumerGroup(
    {
      kafkaHost: process.env.KAFKA_URL,
      groupId: process.env.KAFKA_GROUP_ID,
      autoCommit: true,
    },
    Topics
  );

  consumer.on("message", function (message) {
    console.log(
      `Received message: ${message.value} from topic ${message.topic} at offset ${message.offset} in group ${group_id}`
    );

    // Call different functions based on the topic
    switch (message.topic) {
      case "topic1":
        handleTopic1(message.value);
        break;
      case "topic2":
        handleTopic2(message.value);
        break;
      case "topic3":
        handleTopic3(message.value);
        break;
      // Add more cases for additional topics as needed
      default:
        console.log(`No handler for topic ${message.topic}`);
    }
  });
  consumer.on("error", function (error) {
    console.error(error);
  });

  // if (
  //   process.env.SUBMISSION_RATING_QUEUE_TOPIC &&
  //   process.env.SUBMISSION_RATING_QUEUE_TOPIC != "OFF"
  // ) {
  //   let consumer = new kafka.ConsumerGroup(
  //     {
  //       kafkaHost: process.env.KAFKA_URL,
  //       groupId: process.env.KAFKA_GROUP_ID,
  //       autoCommit: true,
  //     },
  //     process.env.SUBMISSION_RATING_QUEUE_TOPIC
  //   );

  //   consumer.on("message", async function (message) {
  //     console.log("-------Kafka consumer log starts here------------------");
  //     console.log("Topic Name: ", process.env.SUBMISSION_RATING_QUEUE_TOPIC);
  //     console.log("Message: ", JSON.stringify(message));
  //     console.log("-------Kafka consumer log ends here------------------");

  //     submissionRatingQueueConsumer.messageReceived(message);
  //   });

  //   consumer.on("error", async function (error) {
  //     submissionRatingQueueConsumer.errorTriggered(error);
  //   });

  //   const topics = [{ topic: process.env.USER_DELETE_TOPIC }];

  //   const options = {
  //     autoCommit: true,
  //   };

  //   const deleteConsumer = new Consumer(client, topics, options);

  //   deleteConsumer.on("message", function (message) {
  //     console.log("-------Kafka consumer log starts here------------------");
  //     console.log("Topic Name: ", process.env.USER_DELETE_TOPIC);
  //     console.log("Message: ", JSON.stringify(message));
  //     console.log("-------Kafka consumer log ends here------------------");

  //     userDMSConsumer.messageReceived(message);
  //   });

  //   deleteConsumer.on("error", function (err) {
  //     userDMSConsumer.errorTriggered(err);
  //   });
  // }

  return {
    kafkaProducer: producer,
    kafkaClient: client,
    kafkaKeyedMessage: KeyedMessage,
  };
};

module.exports = connect;
