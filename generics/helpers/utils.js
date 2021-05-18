const uuid = require('uuid/v4');
const md5 = require("md5");

function camelCaseToTitleCase(in_camelCaseString) {
  var result = in_camelCaseString // "ToGetYourGEDInTimeASongAboutThe26ABCsIsOfTheEssenceButAPersonalIDCardForUser456InRoom26AContainingABC26TimesIsNotAsEasyAs123ForC3POOrR2D2Or2R2D"
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2") // "To Get YourGEDIn TimeASong About The26ABCs IsOf The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times IsNot AsEasy As123ForC3POOrR2D2Or2R2D"
    .replace(/([A-Z][a-z])([A-Z])/g, "$1 $2") // "To Get YourGEDIn TimeASong About The26ABCs Is Of The Essence ButAPersonalIDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
    .replace(/([a-z])([A-Z]+[a-z])/g, "$1 $2") // "To Get Your GEDIn Time ASong About The26ABCs Is Of The Essence But APersonal IDCard For User456In Room26AContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
    .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, "$1 $2") // "To Get Your GEDIn Time A Song About The26ABCs Is Of The Essence But A Personal ID Card For User456In Room26A ContainingABC26Times Is Not As Easy As123ForC3POOr R2D2Or2R2D"
    .replace(/([a-z]+)([A-Z0-9]+)/g, "$1 $2") // "To Get Your GEDIn Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3POOr R2D2Or 2R2D"

    // Note: the next regex includes a special case to exclude plurals of acronyms, e.g. "ABCs"
    .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, "$1 $2") // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"
    .replace(/([0-9])([A-Z][a-z]+)/g, "$1 $2") // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456In Room 26A Containing ABC 26Times Is Not As Easy As 123For C3PO Or R2D2Or 2R2D"

    // Note: the next two regexes use {2,} instead of + to add space on phrases like Room26A and 26ABCs but not on phrases like R2D2 and C3PO"
    .replace(/([A-Z]{2,})([0-9]{2,})/g, "$1 $2") // "To Get Your GED In Time A Song About The 26ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
    .replace(/([0-9]{2,})([A-Z]{2,})/g, "$1 $2") // "To Get Your GED In Time A Song About The 26 ABCs Is Of The Essence But A Personal ID Card For User 456 In Room 26A Containing ABC 26 Times Is Not As Easy As 123 For C3PO Or R2D2 Or 2R2D"
    .trim();

  // capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function lowerCase(str) {
  return str.toLowerCase()
}

function checkIfStringIsUrl(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
}

function generateRandomCharacters(numberOfChar) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz123456789!@#%&*";
  for (var i = 0; i < numberOfChar; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getCriteriaIds(themes) {
  let allCriteriaIds = [];
  themes.forEach(theme => {
    let criteriaIdArray = [];
    if (theme.children) {
      criteriaIdArray = this.getCriteriaIds(theme.children);
    } else {
      criteriaIdArray = theme.criteria;
    }
    criteriaIdArray.forEach(eachCriteria => {
      if (eachCriteria.criteriaId) {
        allCriteriaIds.push(eachCriteria.criteriaId);
      } else {
        allCriteriaIds.push(eachCriteria);
      }
    })
  })
  return allCriteriaIds;
}

function getCriteriaIdsAndWeightage(themes) {
  let allCriteriaIds = [];
  themes.forEach(theme => {
    let criteriaIdArray = [];
    if (theme.children) {
      criteriaIdArray = this.getCriteriaIdsAndWeightage(theme.children);
    } else {
      criteriaIdArray = theme.criteria;
    }
    criteriaIdArray.forEach(eachCriteria => {
      allCriteriaIds.push({
        criteriaId: eachCriteria.criteriaId,
        weightage: eachCriteria.weightage
      });
    })
  })
  return allCriteriaIds;
}

function getUserRole(userDetails, caseSensitive = false) {
  if (userDetails && userDetails.allRoles.length) {
    _.pull(userDetails.allRoles, 'PUBLIC');
    let role = userDetails.allRoles[0];
    if (caseSensitive == true) {
      return mapUserRole(role)
    }
    return role;
  } else {
    return
  }
}

function getReadableUserRole(userDetails) {
  if (userDetails && userDetails.allRoles.length) {

    _.pull(userDetails.allRoles, 'PUBLIC');

    let readableRoles = {
      ASSESSOR: "Assessors",
      LEAD_ASSESSOR: "Lead Assessors",
      PROJECT_MANAGER: "Project Managers",
      PROGRAM_MANAGER: "Program Managers"
    }

    return readableRoles[userDetails.allRoles[0]] || "";
  } else {
    return
  }
}

function fetchAssessorsLeadAssessorRole() {
  return [
      "LEAD_ASSESSOR",
      "ASSESSOR"
  ]
}

function mapUserRole(role) {
  let allRoles = assessmentRoles()
  return allRoles[role];
}

function assessmentRoles() {
  let allRoles = {
    ASSESSOR: "assessors",
    LEAD_ASSESSOR: "leadAssessors",
    PROJECT_MANAGER: "projectManagers",
    PROGRAM_MANAGER: "programManagers"
  }
  return allRoles;
}

function getAllQuestionId(criteria) {
  let questionIds = [];
  criteria.forEach(eachCriteria => {
    eachCriteria.evidences.forEach(eachEvidence => {
      eachEvidence.sections.forEach(eachSection => {
        eachSection.questions.forEach(eachQuestion => {
          questionIds.push(eachQuestion)
        })
      })
    })
  })
  return questionIds
}

function valueParser(dataToBeParsed) {

  let parsedData = {}

  Object.keys(dataToBeParsed).forEach(eachDataToBeParsed => {
    parsedData[eachDataToBeParsed] = dataToBeParsed[eachDataToBeParsed].trim()
  })

  if(parsedData._arrayFields && parsedData._arrayFields.split(",").length > 0) {
    parsedData._arrayFields.split(",").forEach(arrayTypeField => {
      if (parsedData[arrayTypeField]) {
        parsedData[arrayTypeField] = parsedData[arrayTypeField].split(",")
      }
    })
  }

  return parsedData
}

function arrayIdsTobjectIds(ids) {
  return ids.map(id => ObjectId(id));
}

function checkIfEnvDataExistsOrNot(data){
  
  let value;

  if(process.env[data] && process.env[data] !== ""){
    value  = process.env[data];
  } else {
    let defaultEnv = "DEFAULT_"+data;
    value = process.env[defaultEnv];
  }

  return value;
}

 /**
  * Get epoch time from current date.
  * @function
  * @name epochTime
  * @returns {Date} returns epoch time.  
*/

function epochTime() {
  var currentDate = new Date();
  currentDate = currentDate.getTime();
  return currentDate;
}

 /**
  * check whether id is mongodbId or not.
  * @function
  * @name isValidMongoId
  * @param {String} id 
  * @returns {Boolean} returns whether id is valid mongodb id or not.  
*/

function isValidMongoId(id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

/**
  * generate uuid
  * @function
  * @name generateUUId
  * @returns {String} returns uuid.  
*/

function generateUUId() {
  return uuid();
}

/**
  * md5 hash
  * @function
  * @name md5Hash
  * @returns {String} returns uuid.  
*/

function md5Hash(value) {
  return md5(value);
}

/**
  * Remove duplicates from array
  * @function
  * @name removeDuplicatesFromArray
  * @returns {Array}  returns unique data in array.  
*/

function removeDuplicatesFromArray(data, key) {
  let uniqueArray = [];
  let newMap = new Map();
 
  uniqueArray = data.filter((singleData) => {
  const element = newMap.get(singleData[key].toString());
  if (!element) {
    newMap.set(singleData[key].toString(), singleData);
    return true;
  } else {
      return false;
    }
  });
 
  return uniqueArray;
}

function convertStringToBoolean(stringData) {
  let stringToBoolean = (stringData === "TRUE" || stringData === "true");
  return stringToBoolean;
}

module.exports = {
  camelCaseToTitleCase : camelCaseToTitleCase,
  lowerCase : lowerCase,
  checkIfStringIsUrl : checkIfStringIsUrl,
  generateRandomCharacters : generateRandomCharacters,
  getCriteriaIds : getCriteriaIds,
  getUserRole : getUserRole,
  getReadableUserRole : getReadableUserRole,
  mapUserRole : mapUserRole,
  valueParser : valueParser,
  getAllQuestionId : getAllQuestionId,
  getCriteriaIdsAndWeightage : getCriteriaIdsAndWeightage,
  assessmentRoles : assessmentRoles,
  arrayIdsTobjectIds : arrayIdsTobjectIds,
  checkIfEnvDataExistsOrNot : checkIfEnvDataExistsOrNot,
  fetchAssessorsLeadAssessorRole : fetchAssessorsLeadAssessorRole,
  epochTime : epochTime,
  isValidMongoId : isValidMongoId,
  generateUUId : generateUUId,
  md5Hash : md5Hash,
  removeDuplicatesFromArray : removeDuplicatesFromArray,
  convertStringToBoolean : convertStringToBoolean
};
