//dependencies
const kafka = require('kafka-node')

var connect = function() {

    Producer = kafka.Producer
    KeyedMessage = kafka.KeyedMessage
    client = new kafka.KafkaClient({
      kafkaHost : process.env.KAFKA_URL
    })

    client.on('error', function(error) {
      console.error.bind(console, "kafka connection error!")
    });

    producer = new Producer(client)

    producer.on('ready', function () {
      console.log("Connected to Kafka");
    });
   
    producer.on('error', function (err) {
      console.error.bind(console, "kafka producer creation error!")
    })

    if(process.env.SUBMISSION_RATING_QUEUE_TOPIC["submissionRatingQueueTopic"] && process.env.SUBMISSION_RATING_QUEUE_TOPIC["submissionRatingQueueTopic"] != "") {

        let consumer = new kafka.ConsumerGroup(
          {
              kafkaHost : process.env.KAFKA_URL,
              groupId : process.env.KAFKA_GROUP_ID,
              autoCommit : true
          },
          process.env.SUBMISSION_RATING_QUEUE_TOPIC["submissionRatingQueueTopic"]
          ); 

        consumer.on('message', async function (message) {
          submissionRatingQueueConsumer.messageReceived(message)
        });

        consumer.on('error', async function (error) {
          submissionRatingQueueConsumer.errorTriggered(error)
        });

    }

    return {
      kafkaProducer: producer,
      kafkaClient: client,
      kafkaKeyedMessage: KeyedMessage
    };

};

module.exports = connect;
