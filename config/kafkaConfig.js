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

   

    if(process.env.SUBMISSION_RATING_QUEUE_TOPIC && process.env.SUBMISSION_RATING_QUEUE_TOPIC != "OFF") {

        let consumer = new kafka.ConsumerGroup(
          {
              kafkaHost : process.env.KAFKA_URL,
              groupId : process.env.KAFKA_GROUP_ID,
              autoCommit : true
          },
          process.env.SUBMISSION_RATING_QUEUE_TOPIC
          ); 

        consumer.on('message', async function (message) {

            console.log("-------Kafka consumer log starts here------------------");
            console.log("Topic Name: ",  process.env.SUBMISSION_RATING_QUEUE_TOPIC);
            console.log("Message: ", JSON.stringify(message));
            console.log("-------Kafka consumer log ends here------------------");

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
