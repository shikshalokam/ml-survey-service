// const emailCommunicationsOnOff = (!process.env.EMAIL_COMMUNICATIONS_ON_OFF || process.env.EMAIL_COMMUNICATIONS_ON_OFF != "OFF") ? "ON" : "OFF"
const emailCommunicationsOnOff = "OFF";
const emailServiceBaseUrl = (process.env.EMAIL_SERVICE_BASE_URL && process.env.EMAIL_SERVICE_BASE_URL != "") ? process.env.EMAIL_SERVICE_BASE_URL : ""
const emailServiceToken = (process.env.EMAIL_SERVICE_TOKEN && process.env.EMAIL_SERVICE_TOKEN != "") ? process.env.EMAIL_SERVICE_TOKEN : ""
const Request = require(GENERIC_HELPERS_PATH+'/httpRequest');

const pushMailToEmailService = function(recipients = "",subject = "", text = "") {

    return new Promise(async (resolve, reject) => {
      try {

          if(emailCommunicationsOnOff != "ON" || emailServiceBaseUrl == "" || emailServiceToken == "") throw new Error("Email Configuration missing.")

          if(recipients == "") {
            throw new Error("Email Recipients Missing.")
          }

          let reqObj = new Request()

          let options = {
              headers : {
                "x-auth-token": emailServiceToken
              },
              json : {
                "emails": recipients.split(","),
                "subject": subject,
                "message": text
              }
          }

          let response = await reqObj.post(
              emailServiceBaseUrl,
              options
          )

          if(response.status != "success") return reject({success: false,message : response.message})
          
          return resolve({success: true,message : response.message})

      } catch (error) {
          return reject(error);
      }
  })
}

module.exports = {
  pushMailToEmailService : pushMailToEmailService
};

