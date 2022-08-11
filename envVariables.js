let table = require("cli-table");
const Log = require("log");

let log = new Log("debug");

let tableData = new table();

let enviromentVariables = {
  "APPLICATION_PORT" : {
    "message" : "Required port no",
    "optional" : false
  },
  "APPLICATION_ENV" : {
    "message" : "Required node environment",
    "optional" : false
  },
  "MONGODB_URL" : {
    "message" : "Required mongodb url",
    "optional" : false
  },
  "USER_SERVICE_URL" : {
    "message" : "Required user service base url",
    "optional" : false
  },
  "INTERNAL_ACCESS_TOKEN" : {
    "message" : "Required internal access token",
    "optional" : false
  },
  "KAFKA_COMMUNICATIONS_ON_OFF" : {
    "message" : "Enable/Disable kafka communications",
    "optional" : false
  },
  "KAFKA_URL" : {
    "message" : "Required kafka url",
    "optional" : false
  },
  "KAFKA_GROUP_ID" : {
    "message" : "Required kafka group id",
    "optional" : false
  },
  "SUBMISSION_RATING_QUEUE_TOPIC" : {
    "message" : "OFF/TOPIC_NAME",
    "optional" : false
  },
  "OBSERVATION_SUBMISSION_TOPIC" : {
    "message" : "OFF/TOPIC_NAME",
    "optional" : false
  },
  "COMPLETED_SURVEY_SUBMISSION_TOPIC" : {
    "message" : "OFF/TOPIC_NAME",
    "optional" : false
  },
  "INCOMPLETE_SURVEY_SUBMISSION_TOPIC" : {
    "message" : "OFF/TOPIC_NAME",
    "optional" : false
  },
  // "ELASTICSEARCH_COMMUNICATIONS_ON_OFF" : {
  //   "message" : "Enable/Disable elastic search communications",
  //   "optional" : false
  // },
  // "ELASTICSEARCH_HOST_URL" : {
  //   "message" : "Required elastic search host",
  //   "optional" : false
  // },
  // "ELASTICSEARCH_ENTITIES_INDEX" : {
  //   "message" : "Required entities index",
  //   "optional" : false
  // },
  "ML_CORE_SERVICE_URL" : {
    "message" : "Required core service url",
    "optional" : false
  },
  "ML_PROJECT_SERVICE_URL" : {
    "message" : "Required project service url",
    "optional" : false
  },
  "KEYCLOAK_PUBLIC_KEY_PATH" : {
    "message" : "Required keycloak public key path",
    "optional" : false
  },
  // "ELASTIC_SEARCH_SNIFF_ON_START" : {
  //   "message" : "Elastic search sniff on start",
  //   "optional" : false
  // },
  "DISABLE_LEARNER_SERVICE_ON_OFF": {
    "message" : "Disable learner service on/off",
    "default": "ON"
  },
  "REDIS_URL": {
    "message" : "Required redis url",
    "optional" : false
  },
  "REDIS_DB": {
    "message" : "Required redis dbname",
    "optional" : false
  },
  "REDIS_TTL": {
    "message" : "Required redis ttl",
    "optional" : true,
    "default": 86400
  },
}

let success = true;

module.exports = function() {
  Object.keys(enviromentVariables).forEach(eachEnvironmentVariable=>{
  
    let tableObj = {
      [eachEnvironmentVariable] : "PASSED"
    };
  
    let keyCheckPass = true;


    if(enviromentVariables[eachEnvironmentVariable].optional === true
      && enviromentVariables[eachEnvironmentVariable].requiredIf
      && enviromentVariables[eachEnvironmentVariable].requiredIf.key
      && enviromentVariables[eachEnvironmentVariable].requiredIf.key != ""
      && enviromentVariables[eachEnvironmentVariable].requiredIf.operator
      && validRequiredIfOperators.includes(enviromentVariables[eachEnvironmentVariable].requiredIf.operator)
      && enviromentVariables[eachEnvironmentVariable].requiredIf.value
      && enviromentVariables[eachEnvironmentVariable].requiredIf.value != "") {
        switch (enviromentVariables[eachEnvironmentVariable].requiredIf.operator) {
          case "EQUALS":
            if(process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] === enviromentVariables[eachEnvironmentVariable].requiredIf.value) {
              enviromentVariables[eachEnvironmentVariable].optional = false;
            }
            break;
          case "NOT_EQUALS":
              if(process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] != enviromentVariables[eachEnvironmentVariable].requiredIf.value) {
                enviromentVariables[eachEnvironmentVariable].optional = false;
              }
              break;
          default:
            break;
        }
    }
      
    if(enviromentVariables[eachEnvironmentVariable].optional === false) {
      if(!(process.env[eachEnvironmentVariable])
        || process.env[eachEnvironmentVariable] == "") {
        success = false;
        keyCheckPass = false;
      } else if (enviromentVariables[eachEnvironmentVariable].possibleValues
        && Array.isArray(enviromentVariables[eachEnvironmentVariable].possibleValues)
        && enviromentVariables[eachEnvironmentVariable].possibleValues.length > 0) {
        if(!enviromentVariables[eachEnvironmentVariable].possibleValues.includes(process.env[eachEnvironmentVariable])) {
          success = false;
          keyCheckPass = false;
          enviromentVariables[eachEnvironmentVariable].message += ` Valid values - ${enviromentVariables[eachEnvironmentVariable].possibleValues.join(", ")}`
        }
      }
    }

    if((!(process.env[eachEnvironmentVariable])
      || process.env[eachEnvironmentVariable] == "")
      && enviromentVariables[eachEnvironmentVariable].default
      && enviromentVariables[eachEnvironmentVariable].default != "") {
      process.env[eachEnvironmentVariable] = enviromentVariables[eachEnvironmentVariable].default;
    }

    if(!keyCheckPass) {
      if(enviromentVariables[eachEnvironmentVariable].message !== "") {
        tableObj[eachEnvironmentVariable] = 
        enviromentVariables[eachEnvironmentVariable].message;
      } else {
        tableObj[eachEnvironmentVariable] = `FAILED - ${eachEnvironmentVariable} is required`;
      }
    }

    tableData.push(tableObj);
  })

  log.info(tableData.toString());

  return {
    success : success
  }
}
