const kafkaCommunicationsOnOff = (!process.env.KAFKA_COMMUNICATIONS_ON_OFF || process.env.KAFKA_COMMUNICATIONS_ON_OFF != "OFF") ? "ON" : "OFF"
const completedSubmissionKafkaTopic = (process.env.COMPLETED_SUBMISSION_TOPIC && process.env.COMPLETED_SUBMISSION_TOPIC != "OFF") ? process.env.COMPLETED_SUBMISSION_TOPIC : "sl-submissions-dev"
const inCompleteSubmissionKafkaTopic = (process.env.INCOMPLETE_SUBMISSION_TOPIC && process.env.INCOMPLETE_SUBMISSION_TOPIC != "OFF") ? process.env.INCOMPLETE_SUBMISSION_TOPIC : "sl-incomplete-submissions-dev"
const submissionRatingQueueKafkaTopic = (process.env.SUBMISSION_RATING_QUEUE_TOPIC && process.env.SUBMISSION_RATING_QUEUE_TOPIC != "OFF") ? process.env.SUBMISSION_RATING_QUEUE_TOPIC : "sl-submissions-rating-dev"
const notificationsKafkaTopic = (process.env.NOTIFICATIONS_TOPIC && process.env.NOTIFICATIONS_TOPIC != "OFF") ? process.env.NOTIFICATIONS_TOPIC : "sl-notifications-dev"
const completedSurveySubmissionKafkaTopic = (process.env.COMPLETED_SURVEY_SUBMISSION_TOPIC && process.env.COMPLETED_SURVEY_SUBMISSION_TOPIC != "OFF") ? process.env.COMPLETED_SURVEY_SUBMISSION_TOPIC : "sl_surveys_raw"
const inCompleteSurveySubmissionKafkaTopic = (process.env.INCOMPLETE_SURVEY_SUBMISSION_TOPIC && process.env.INCOMPLETE_SURVEY_SUBMISSION_TOPIC != "OFF") ? process.env.INCOMPLETE_SURVEY_SUBMISSION_TOPIC : "sl_incomplete_surveys_raw"
const improvementProjectSubmissionTopic = (process.env.IMPROVEMENT_PROJECT_SUBMISSION_TOPIC && process.env.IMPROVEMENT_PROJECT_SUBMISSION_TOPIC != "OFF") ? process.env.IMPROVEMENT_PROJECT_SUBMISSION_TOPIC : "sl-improvement-project-submission-dev";
const observationSubmissionKafkaTopic = (process.env.OBSERVATION_SUBMISSION_TOPIC && process.env.OBSERVATION_SUBMISSION_TOPIC != "OFF") ? process.env.OBSERVATION_SUBMISSION_TOPIC : "sl-observations-dev"


const pushObservationSubmissionToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: observationSubmissionKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          console.log("error is",error)
          return reject(error);
      }
  })
}

const pushCompletedSubmissionToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: completedSubmissionKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushInCompleteSubmissionToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: inCompleteSubmissionKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushSubmissionToKafkaQueueForRating = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: submissionRatingQueueKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushObservationSubmissionToKafkaQueueForRating = function (message) {
  return new Promise(async (resolve, reject) => {
      try {
       
          let kafkaPushStatus = await pushMessageToKafka([{
            topic: submissionRatingQueueKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushUserMappingNotificationToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: notificationsKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushCompletedSurveySubmissionToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: completedSurveySubmissionKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushInCompleteSurveySubmissionToKafka = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: inCompleteSurveySubmissionKafkaTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushSubmissionToImprovementService = function (message) {
  return new Promise(async (resolve, reject) => {
      try {

          let kafkaPushStatus = await pushMessageToKafka([{
            topic: improvementProjectSubmissionTopic,
            messages: JSON.stringify(message)
          }])

          return resolve(kafkaPushStatus)

      } catch (error) {
          return reject(error);
      }
  })
}

const pushMessageToKafka = function(payload) {
  return new Promise((resolve, reject) => {

    if (kafkaCommunicationsOnOff != "ON") {
      throw reject("Kafka configuration is not done")
    }

    console.log("-------Kafka log starts here------------------");
    console.log("Topic Name: ", payload[0].topic);
    console.log(JSON.stringify(payload));
    console.log("-------Kafka log ends here------------------");

    kafkaClient.kafkaProducer.send(payload, (err, data) => {
      if (err) {
        return reject("Kafka push to topic "+ payload[0].topic +" failed.")
      } else {
        return resolve(data)
      }
    })

  }).then(result => {

    if(result[payload[0].topic][0] >0) {
      return {
        status : "success",
        message: "Kafka push to topic "+ payload[0].topic +" successful with number - "+result[payload[0].topic][0]
      }
    }

  }).catch((err) => {
    return {
      status : "failed",
      message: err
    }
  })
}

module.exports = {
  pushCompletedSubmissionToKafka : pushCompletedSubmissionToKafka,
  pushUserMappingNotificationToKafka : pushUserMappingNotificationToKafka,
  pushSubmissionToKafkaQueueForRating : pushSubmissionToKafkaQueueForRating,
  pushObservationSubmissionToKafkaQueueForRating : pushObservationSubmissionToKafkaQueueForRating,
  pushInCompleteSubmissionToKafka : pushInCompleteSubmissionToKafka,
  pushCompletedSurveySubmissionToKafka : pushCompletedSurveySubmissionToKafka,
  pushInCompleteSurveySubmissionToKafka : pushInCompleteSurveySubmissionToKafka,
  pushSubmissionToImprovementService : pushSubmissionToImprovementService,
  pushObservationSubmissionToKafka: pushObservationSubmissionToKafka
};

