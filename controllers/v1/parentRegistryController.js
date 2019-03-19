const csv = require("csvtojson");

module.exports = class ParentRegistry extends Abstract {

  /**
   * @apiDefine errorBody
   * @apiError {String} status 4XX,5XX
   * @apiError {String} message Error
   */

  /**
     * @apiDefine successBody
     *  @apiSuccess {String} status 200
     * @apiSuccess {String} result Data
     */

  constructor() {
    super(parentRegistrySchema);
  }

  static get name() {
    return "parentRegistry";
  }

  /**
  * @api {post} /assessment/api/v1/parentRegistry/add Parent registry add
  * @apiVersion 0.0.1
  * @apiName Parent Registry add
  * @apiGroup ParentRegistry
  * @apiParamExample {json} Request-Body:
  * {
  *	"parents": [
  *       {
  *	        "studentName" : "",
  *	        "grade" : "",
  *	        "name" : "",
  *	        "gender" : "",
  *   		  "type": "",
  *  		    "typeLabel":"",
  * 		    "phone1": "Phone",
  * 		    "phone2": "",
  * 		    "address": "",
  *	        "schoolId" : "",
  *   		  "schoolName": "",
  *  		    "programId": ""
  *      },
  *	]
  *}
  * @apiUse successBody
  * @apiUse errorBody
  */

  add(req) {

    return new Promise(async (resolve, reject) => {

      try {

        if (req.body.parents) {

          req.body.parents.forEach(parent => {
            if (typeof parent.type === "string") {
              parent.type = new Array(parent.type)
            }
          })

          var parentRegistryDocuments = await database.models.parentRegistry.create(
            req.body.parents
          );

          if(parentRegistryDocuments.length != req.body.parents.length) {
            throw "Some parent information was not inserted!"
          }

        } else {
          throw "Bad Request"
        }

        let responseMessage = "Parent information added successfully."

        let response = { message: responseMessage, result: parentRegistryDocuments};

        return resolve(response);
      } catch (error) {
        return reject({ message: error });
      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/parentRegistry/list/:schoolId Parent Registry list
  * @apiVersion 0.0.1
  * @apiName Parent Registry list
  * @apiGroup ParentRegistry
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/parentRegistry/list/5c48875a4196bd6d6904c2c3
  * @apiUse successBody
  * @apiUse errorBody
  */

  list(req) {

    return new Promise(async (resolve, reject) => {

      try {

        req.body = req.body || {};
        let result = {}

        if (req.params._id) {

          let queryObject = {
            schoolId: req.params._id
          }

          result = await database.models.parentRegistry.find(
            queryObject
          ).lean();

          let submissionParentInterviewResponses = await database.models.submissions.findOne(
            {
              schoolId : req.params._id
            },
            {
              parentInterviewResponses : 1
            }
          ).lean();
          
          submissionParentInterviewResponses = (submissionParentInterviewResponses && submissionParentInterviewResponses.parentInterviewResponses && Object.values(submissionParentInterviewResponses.parentInterviewResponses).length > 0) ? submissionParentInterviewResponses.parentInterviewResponses : {}
          result = result.map(function (parent) {

            if (parent.type.length > 0) {

              let parentTypeLabelArray = new Array

              parent.type.forEach(parentType => {
                let parentTypeLabel
                switch (parentType) {
                  case "P1":
                    parentTypeLabel = "Parent only"
                    break;
                  case "P2":
                    parentTypeLabel = "SMC Parent Member"
                    break;
                  case "P3":
                    parentTypeLabel = "Safety Committee Member"
                    break;
                  case "P4":
                    parentTypeLabel = "EWS-DG Parent"
                    break;
                  case "P5":
                    parentTypeLabel = "Social Worker"
                    break;
                  case "P6":
                    parentTypeLabel = "Elected Representative Nominee"
                    break;
                  default:
                    break;
                }

                if (parentTypeLabel != "") {
                  parentTypeLabelArray.push(parentTypeLabel)
                }

              })

              parent.typeLabel = parentTypeLabelArray

            }

            if (parent.callResponse != "") {
              let parentCallResponseLabel
              switch (parent.callResponse) {
                case "R1":
                  parentCallResponseLabel = "Call not initiated"
                  break;
                case "R2":
                  parentCallResponseLabel = "Did not pick up"
                  break;
                case "R3":
                  parentCallResponseLabel = "Not reachable"
                  break;
                case "R4":
                  parentCallResponseLabel = "Call back later"
                  break;
                case "R5":
                  parentCallResponseLabel = "Wrong number"
                  break;
                case "R6":
                  parentCallResponseLabel = "Call disconnected mid way"
                  break;
                case "R7":
                  parentCallResponseLabel = "Completed"
                  break;
                case "R00":
                  parentCallResponseLabel = "Call Response Completed But Survey Not Completed."
                  break;
                default:
                  break;
              }

              parent.callResponse = parentCallResponseLabel
            }

            parent.submissionStatus = (submissionParentInterviewResponses[parent._id.toString()]) ? submissionParentInterviewResponses[parent._id.toString()].status : ""
            return parent;
          })

        } else {
          throw "Bad Request"
        }

        let responseMessage = "Parent information fetched successfully."

        let response = { message: responseMessage, result: result };

        return resolve(response);
      } catch (error) {
        return reject({ message: error });
      }

    })
  }

  /**
* @api {post} /assessment/api/v1/parentRegistry/upload Upload Parent Information CSV
* @apiVersion 0.0.1
* @apiName Upload Parent Information CSV
* @apiGroup ParentRegistry
* @apiParamExample {json} Request-Body:
* 	Upload CSV
* @apiUse successBody
* @apiUse errorBody
*/

  async upload(req) {

    return new Promise(async (resolve, reject) => {

      try {
        let schoolWiseParentsData = await csv().fromString(req.files.parents.data.toString());

        let schoolQueryList = {}
        let programQueryList = {}

        schoolWiseParentsData.forEach(schoolWiseParents => {
          schoolQueryList[schoolWiseParents.schoolId] = schoolWiseParents.schoolId
          programQueryList[schoolWiseParents.schoolId] = schoolWiseParents.programId
        });

        let schoolsFromDatabase = await database.models.schools.find({
          externalId: { $in: Object.values(schoolQueryList) }
        }, {
            externalId: 1,
            name: 1
          });

        let programsFromDatabase = await database.models.programs.find({
          externalId: { $in: Object.values(programQueryList) }
        });

        const schoolsData = schoolsFromDatabase.reduce(
          (ac, school) => ({ ...ac, [school.externalId]: { _id: school._id, name: school.name } }), {})

        const programsData = programsFromDatabase.reduce(
          (ac, program) => ({ ...ac, [program.externalId]: program }), {})


        schoolWiseParentsData = await Promise.all(schoolWiseParentsData.map(async (schoolWiseParents) => {

          let parentInformation = new Array
          let nameOfParentTypeField
          let nameOfParentTypeLabelField
          let nameOfParentNameField
          let nameOfParentAddressField
          let nameOfParentPhoneField
          let validParentCount = 0

          for (let parentCounter = 1; parentCounter < 50; parentCounter++) {
            nameOfParentTypeField = "parent" + parentCounter + "Type";
            nameOfParentNameField = "parent" + parentCounter + "Name";
            nameOfParentAddressField = "parent" + parentCounter + "Address";
            nameOfParentPhoneField = "parent" + parentCounter + "Phone";

            if (schoolWiseParents[nameOfParentNameField] && schoolWiseParents[nameOfParentPhoneField] && schoolsData[schoolWiseParents.schoolId] && schoolWiseParents[nameOfParentNameField] != "" && schoolWiseParents[nameOfParentPhoneField].length > 5) {
              parentInformation.push({
                name: schoolWiseParents[nameOfParentNameField],
                type: schoolWiseParents[nameOfParentTypeField],
                phone1: schoolWiseParents[nameOfParentPhoneField],
                address: schoolWiseParents[nameOfParentAddressField],
                programId: programsData[schoolWiseParents.programId]._id.toString(),
                schoolId: schoolsData[schoolWiseParents.schoolId]._id.toString(),
                schoolName: schoolsData[schoolWiseParents.schoolId].name,
              })
              validParentCount += 1
            }
          }

          parentInformation = await Promise.all(parentInformation.map(async (parent) => {

            parent = await database.models.parentRegistry.findOneAndUpdate(
              {
                phone1: parent.phone1,
                programId: parent.programId,
                schoolId: parent.schoolId
              },
              parent,
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
                returnNewDocument: true
              }
            );
            return parent

          }));

          if (validParentCount > 0 && validParentCount == parentInformation.length) {
            return parentInformation
          } else {
            return;
          }

        }));

        if (schoolWiseParentsData.findIndex(school => school === undefined) >= 0) {
          throw "Something went wrong, not all records were inserted/updated."
        }

        let responseMessage = "Parents record created successfully."

        let response = { message: responseMessage };

        return resolve(response);

      } catch (error) {
        return reject({ message: error });
      }

    })
  }

  /**
  * @api {get} /assessment/api/v1/parentRegistry/form Parent registry form
  * @apiVersion 0.0.1
  * @apiName Parent Registry form
  * @apiGroup ParentRegistry
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/parentRegistry/form
  * @apiUse successBody
  * @apiUse errorBody
  */

  async form(req) {
    return new Promise(async function (resolve, reject) {

      let result = [
        {
          field: "studentName",
          label: "Student Name",
          value: "",
          visible: true,
          editable: true,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "grade",
          label: "Grade",
          value: "",
          visible: true,
          editable: true,
          input: "radio",
          options: [
            {
              value: "nursery",
              label: "Nursery"
            },
            {
              value: "lowerKG",
              label: "Lower KG"
            },
            {
              value: "upperKG",
              label: "Upper KG"
            },
            {
              value: "kindergarten",
              label: "Kindergarten"
            },
            {
              value: "1",
              label: 1
            },
            {
              value: "2",
              label: 2
            },
            {
              value: "3",
              label: 3
            },
            {
              value: "4",
              label: 4
            },
            {
              value: "5",
              label: 5
            },
            {
              value: "6",
              label: 6
            },
            {
              value: "7",
              label: 7
            },
            {
              value: "8",
              label: 8
            },
            {
              value: "9",
              label: 9
            },
            {
              value: "10",
              label: 10
            },
            {
              value: "11",
              label: 11
            },
            {
              value: "12",
              label: 12
            }
          ],
          validation: {
            required: true
          }
        },
        {
          field: "section",
          label: "Section",
          value: "",
          visible: true,
          editable: true,
          input: "text",
          validation: {
            required: false,
            regex: "^[a-zA-Z]+$"
          }
        },
        {
          field: "name",
          label: "Parent Name",
          value: "",
          visible: true,
          editable: true,
          input: "text",
          validation: {
            required: false
          }
        },
        {
          field: "gender",
          label: "Parent Gender",
          value: "",
          visible: true,
          editable: true,
          input: "radio",
          options: [
            {
              value: "M",
              label: "Male"
            },
            {
              value: "F",
              label: "Female"
            }
          ],
          validation: {
            required: false
          }
        },
        {
          field: "type",
          label: "Parent Type",
          value: "",
          visible: true,
          editable: true,
          input: "multiselect",
          options: [
            {
              value: "P1",
              label: "Parent only"
            },
            {
              value: "P2",
              label: "SMC Parent Member"
            },
            {
              value: "P3",
              label: "Safety Committee Member"
            },
            {
              value: "P4",
              label: "EWS-DG Parent"
            },
            {
              value: "P5",
              label: "Social Worker"
            },
            {
              value: "P6",
              label: "Elected Representative Nominee"
            }
          ],
          validation: {
            required: false
          }
        },
        {
          field: "phone1",
          label: "Phone Number",
          value: "",
          visible: true,
          editable: true,
          input: "number",
          validation: {
            required: true,
            regex: "^[0-9]{10}+$"
          }
        },
        {
          field: "phone2",
          label: "Additional Phone Number",
          value: "",
          visible: true,
          editable: true,
          input: "number",
          validation: {
            required: false,
            regex: "^[0-9]{10}+$"
          }
        },
        {
          field: "address",
          label: "Residential Address",
          value: "",
          visible: true,
          editable: true,
          input: "textarea",
          validation: {
            required: true
          }
        },
        {
          field: "schoolId",
          label: "School ID",
          value: "",
          visible: false,
          editable: false,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "schoolName",
          label: "School Name",
          value: "",
          visible: false,
          editable: false,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "programId",
          label: "Program ID",
          value: "",
          visible: false,
          editable: false,
          input: "text",
          validation: {
            required: true
          }
        }
      ]

      let responseMessage = "Parent registry from fetched successfully."

      let response = { message: responseMessage, result: result };
      return resolve(response);

    }).catch(error => {
      reject(error);
    });
  }

  /**
  * @api {get} /assessment/api/v1/parentRegistry/fetch/:schoolId Parent profile
  * @apiVersion 0.0.1
  * @apiName Parent Registry profile
  * @apiGroup ParentRegistry
  * @apiHeader {String} X-authenticated-user-token Authenticity token
  * @apiSampleRequest /assessment/api/v1/parentRegistry/fetch/5c48875a4196bd6d6904c2c3
  * @apiUse successBody
  * @apiUse errorBody
  */

  async fetch(req) {
    return new Promise(async function (resolve, reject) {

      let parentInformation = await database.models.parentRegistry.findOne(
        { _id: ObjectId(req.params._id) }
      );

      if (!parentInformation) {
        let responseMessage = `No parent information found for given params.`;
        return resolve({ status: 400, message: responseMessage })
      }

      let result = [
        {
          field: "name",
          label: "Parent Name",
          value: (parentInformation.name) ? parentInformation.name : "",
          visible: true,
          editable: true,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "gender",
          label: "Parent Gender",
          value: (parentInformation.gender) ? parentInformation.gender : "",
          visible: true,
          editable: true,
          input: "radio",
          options: [
            {
              value: "M",
              label: "Male"
            },
            {
              value: "F",
              label: "Female"
            }
          ],
          validation: {
            required: true
          }
        },
        {
          field: "phone1",
          label: "Phone Number",
          value: (parentInformation.phone1) ? parentInformation.phone1 : "",
          visible: true,
          editable: false,
          input: "number",
          validation: {
            required: true,
            regex: "^[0-9]{10}+$"
          }
        },
        {
          field: "phone2",
          label: "Additional Phone Number",
          value: (parentInformation.phone2) ? parentInformation.phone2 : "",
          visible: true,
          editable: true,
          input: "number",
          validation: {
            required: false,
            regex: "^[0-9]{10}+$"
          }
        },
        {
          field: "studentName",
          label: "Student Name",
          value: (parentInformation.studentName) ? parentInformation.studentName : "",
          visible: true,
          editable: true,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "grade",
          label: "Grade",
          value: (parentInformation.grade) ? parentInformation.grade : "",
          visible: true,
          editable: true,
          input: "radio",
          options: [
            {
              value: "nursery",
              label: "Nursery"
            },
            {
              value: "lowerKG",
              label: "Lower KG"
            },
            {
              value: "upperKG",
              label: "Upper KG"
            },
            {
              value: "kindergarten",
              label: "Kindergarten"
            },
            {
              value: "1",
              label: 1
            },
            {
              value: "2",
              label: 2
            },
            {
              value: "3",
              label: 3
            },
            {
              value: "4",
              label: 4
            },
            {
              value: "5",
              label: 5
            },
            {
              value: "6",
              label: 6
            },
            {
              value: "7",
              label: 7
            },
            {
              value: "8",
              label: 8
            },
            {
              value: "9",
              label: 9
            },
            {
              value: "10",
              label: 10
            },
            {
              value: "11",
              label: 11
            },
            {
              value: "12",
              label: 12
            }
          ],
          validation: {
            required: true
          }
        },
        {
          field: "schoolName",
          label: "School Name",
          value: (parentInformation.schoolName) ? parentInformation.schoolName : "",
          visible: true,
          editable: false,
          input: "text",
          validation: {
            required: true
          }
        },
        {
          field: "type",
          label: "Parent Type",
          value: (parentInformation.type) ? parentInformation.type : "",
          visible: true,
          editable: true,
          input: "multiselect",
          options: [
            {
              value: "P1",
              label: "Parent only"
            },
            {
              value: "P2",
              label: "SMC Parent Member"
            },
            {
              value: "P3",
              label: "Safety Committee Member"
            },
            {
              value: "P4",
              label: "EWS-DG Parent"
            },
            {
              value: "P5",
              label: "Social Worker"
            },
            {
              value: "P6",
              label: "Elected Representative Nominee"
            }
          ],
          validation: {
            required: false
          }
        },
        {
          field: "callResponse",
          label: "Call Response",
          value: (parentInformation.callResponse) ? parentInformation.callResponse : "",
          visible: true,
          editable: true,
          input: "radio",
          options: [
            {
              value: "R1",
              label: "Call not initiated"
            },
            {
              value: "R2",
              label: "Did not pick up"
            },
            {
              value: "R3",
              label: "Not reachable"
            },
            {
              value: "R4",
              label: "Call back later"
            },
            {
              value: "R5",
              label: "Wrong number"
            },
            {
              value: "R6",
              label: "Call disconnected mid way"
            }
          ],
          validation: {
            required: true
          }
        }
      ]

      let responseMessage = "Parent interview from fetched successfully."

      let response = { message: responseMessage, result: result };
      return resolve(response);

    }).catch(error => {
      reject(error);
    });
  }


  /**
* @api {post} /assessment/api/v1/parentRegistry/update/:parentRegistryId Update Parent Information
* @apiVersion 0.0.1
* @apiName Update Parent Information
* @apiGroup ParentRegistry
* @apiParamExample {json} Request-Body:
* 	{
*	        "studentName" : "",
*	        "grade" : "",
*	        "name" : "",
*	        "gender" : "",
*   		  "type": "",
*  		    "typeLabel":"",
*  		    "phone1": "",
*  	    	"phone2": "",
*     		"address": "",
*	        "schoolId" : "",
*    		  "schoolName": "",
*    		  "programId": "",
*    		  "callResponse":""
*   }
* @apiUse successBody
* @apiUse errorBody
*/

  async update(req) {
    return new Promise(async function (resolve, reject) {

      try {

        const parentDocument = await database.models.parentRegistry.findOne(
          { _id: ObjectId(req.params._id) }
        );
        
        if(!parentDocument) throw "No such parent found"
        
        let updateSubmissionDocument = false
        if(req.body.updateFromParentPortal === true ) {
          if(req.body.callResponse && req.body.callResponse != "" && (!parentDocument.callResponse || (parentDocument.callResponse != req.body.callResponse) )) {
            req.body.callResponseUpdatedTime = new Date()
          }
          updateSubmissionDocument = true
        }

        let parentInformation = await database.models.parentRegistry.findOneAndUpdate(
          { _id: ObjectId(req.params._id) },
          req.body,
          { new: true }
        );

        if(updateSubmissionDocument) {

          let queryObject = {
            schoolId: ObjectId(parentInformation.schoolId)
          }
          
          let submissionDocument = await database.models.submissions.findOne(
            queryObject,
            {["parentInterviewResponses."+parentInformation._id.toString()] : 1, parentInterviewResponsesStatus : 1}
          );

          let updateObject = {}
          updateObject.$set = {}
          let parentInterviewResponse = {}
          if(submissionDocument.parentInterviewResponses && submissionDocument.parentInterviewResponses[parentInformation._id.toString()]) {
            parentInterviewResponse = submissionDocument.parentInterviewResponses[parentInformation._id.toString()]
            parentInterviewResponse.parentInformation = parentInformation
          } else {
            parentInterviewResponse = {
              parentInformation : parentInformation,
              status: "started",
              startedAt : new Date()
            }
          }

          updateObject.$set = {
            ["parentInterviewResponses."+parentInformation._id.toString()] : parentInterviewResponse
          }

          let parentInterviewResponseStatus = _.omit(parentInterviewResponse, ["parentInformation","answers"])
          parentInterviewResponseStatus.parentId = parentInformation._id
          parentInterviewResponseStatus.parentType = parentInformation.type

          if (submissionDocument.parentInterviewResponsesStatus) {
            let parentInterviewReponseStatusElementIndex = submissionDocument.parentInterviewResponsesStatus.findIndex(parentInterviewStatus => parentInterviewStatus.parentId.toString() === parentInterviewResponseStatus.parentId.toString())
            if(parentInterviewReponseStatusElementIndex >= 0) {
              submissionDocument.parentInterviewResponsesStatus[parentInterviewReponseStatusElementIndex] = parentInterviewResponseStatus
            } else {
              submissionDocument.parentInterviewResponsesStatus.push(parentInterviewResponseStatus)
            }
          } else {
            submissionDocument.parentInterviewResponsesStatus = new Array
            submissionDocument.parentInterviewResponsesStatus.push(parentInterviewResponseStatus)
          }

          updateObject.$set.parentInterviewResponsesStatus = submissionDocument.parentInterviewResponsesStatus

          const submissionDocumentUpdate = await database.models.submissions.findOneAndUpdate(
            { _id: submissionDocument._id},
            updateObject
          );
        }

        let responseMessage = "Parent information updated successfully."

        let response = { message: responseMessage, result: parentInformation };

        return resolve(response);

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }

    });
  }

};