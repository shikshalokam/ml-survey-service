# Debugging Issue Prerequisites and Initial Steps

## Prerequisites for Debugging the Issue Based on the Testing Environment (Pre-prod or Prod):

1. **Diksha VPN Access**
2. **Authentication Token and IP**
   - Auth token to enable the use of ML-services admin APIs in prod and IP details
3. **Access to Rancher**
   - Access to Rancher to check ml-survey-services config files (If server access is there, Rancher access is optional because config files can be obtained using server access)

## Initial Steps to Debug the Issue:

1. **Check for Kafka Topics in ml-survey-service Config**
   - Check if observation submission-related Kafka topics are added to the service correctly.
   - The two Kafka topic variable names that you should check are:
     - `SUBMISSION_RATING_QUEUE_TOPIC`
     - `OBSERVATION_SUBMISSION_TOPIC`

2. **Try to Use `observationSubmissions/rate` API and Check the Response**
   - For this, you will need the details mentioned in prerequisite 2.
   - Sample API cURL:
     ```bash
     curl --location --globoff '{{internal-Ip}}/private/mlsurvey/api/v1/observationSubmissions/rate/81ebb686-251c-4908-a69e-21aa3d974230?solutionId=9d9efa40-6b1f-11ed-9b01-b54f18d93145-OBSERVATION-TEMPLATE_CHILD&createdBy=76f35e8c-7903-4aae-87fd-c297eabc81ab&submissionNumber=1' \
     --header 'X-authenticated-user-token: eyJhbGciOi*********vsCoGw' \
     --header 'X-Channel-id: {{channelId}}' \
     --header 'internal-access-token: e7220******5' \
     --header 'Authorization: Bearer {{jwt}}' \
     --header 'Content-Type: application/json'
     ```
   - URL Explanation:
     `{{internal-Ip}}/private/mlsurvey/api/v1/observationSubmissions/rate/{{entityId}}?solutionId={{childSolutionId}}&createdBy={{userId}}&submissionNumber=1`
