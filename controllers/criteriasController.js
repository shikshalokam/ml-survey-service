const csv = require("csvtojson");

module.exports = class Criterias extends Abstract {
  constructor(schema) {
    super(schema);
  }

  static get name() {
    return "criterias";
  }


  insert(req) {
    let qError = {},
      created = [];
    console.log("reached here!");
    return new Promise((resole, reject) => {
      return database.models.questions
        .find({ externalId: { $in: req.body.questionsExtId } })
        .then(result => {
          if (result.length) {
            return resole({
              message: "Questions Already Existed",
              status: 409,
              result: result
            });
          } else {
            delete req.body.questionsExtId;
            async.forEachOf(
              req.body.evidences,
              (evidence, k, cb1) => {
                console.log(evidence, k);

                async.forEachOf(
                  evidence.sections,
                  (section, j, cb2) => {
                    console.log(section, j);

                    async.forEachOf(
                      section.questions,
                      (question, i, cb3) => {
                        console.log(question, i);
                        if(Object.keys(question.visibleIf[0]).length <= 0) {
                          question.visibleIf = ""
                        }
                        if(question.file.required === false) {
                          question.file = ""
                        }
                        question.owner = req.userDetails.id;
                        database.models.questions
                          .create(question)
                          .then(result => {
                            req.body.evidences[k].sections[j].questions[i] =
                              result._id;
                            created.push(result._id);
                            cb3(null);
                          })
                          .catch(error => {
                            qError[question.externalId] = error.message;
                            cb3(error);
                          });
                      },
                      error => {
                        cb2(error);
                      }
                    );
                  },
                  error => {
                    cb1(error);
                  }
                );
              },
              error => {
                if (error) console.log(error);
                console.log("done", JSON.stringify(req.body.evidences, "", 4));
                if (Object.keys(qError).length) {
                  return database.models.questions
                    .deleteMany({
                      externalId: { $in: Object.keys(qError) }
                    })
                    .then(result => {
                      console.log(result, created, typeof created[0]);

                      return resole({
                        status: 400,
                        failed: qError,
                        message: "Criteria can not be created"
                      });
                    })
                    .catch(error => {
                      throw error;
                    });
                } else {
                  return controllers.questionsController
                    .populateChildQuestions({
                      body: { created: created }
                    })
                    .then(result => {
                      req.body.owner = req.userDetails.id;

                      return super
                        .insert(req)
                        .then(criteria => {
                          return resole(criteria);
                        })
                        .catch(error => {
                          return reject(error);
                        });
                    })
                    .catch(error => {
                      console.log(error);
                    });
                }

                // return resole(Object.assign(super.insert(req), { failed: error }));
              }
            );
          }
        })
        .catch(error => {
          throw error;
        });
    });
  }

  find(req) {
    return super.find(req);
  }

  async getEvidence(req) {
    let criteria = await this.getCriterias(req);
    // log.debug(criteria);
    // return criteria;
    return new Promise(async function(resolve, reject) {
      let merged = {},
        query = [],
        sectionData = {};

      await criteria.forEach(function(value, i) {
        query.push({ _id: ObjectId(value) });
      });

      let criterias = await database.models.criterias.find({ $or: query });
      // log.debug(criterias);
      // if (Array.isArray(criterias)) {

      await _.forEachRight(criterias, async function(crit, i) {
        await crit.evidences.forEach(async function(evidence, i) {
          if (!merged[evidence.externalId]) {
            merged[evidence.externalId] = evidence;
          } else {
            log.debug("Already Done");
            merged[evidence.externalId] = Object.assign(
              merged[evidence.externalId],
              evidence
            );
            await _.forEachRight(evidence.sections, (section, i2) => {
              _.forEachRight(
                merged[evidence.externalId].sections,
                (Msection, mi2) => {
                  log.debug(
                    merged[evidence.externalId].sections.length,
                    evidence.sections.length
                  );
                  if (Msection.name == section.name) {
                    log.debug(
                      Msection.name,
                      "-----matched------>",
                      section.name
                    );
                    // log.debug(
                    //   merged[evidence.externalId].sections[mi2],
                    //   section
                    // );

                    merged[evidence.externalId].sections[mi2].questions.concat(
                      section.questions
                    );
                    log.debug(
                      evidence.externalId,
                      "######################################333",
                      merged[evidence.externalId].sections[mi2].questions,
                      "######################################",
                      section.questions
                    );
                  } else {
                    log.debug(
                      Msection.name,
                      "-----not matched------>",
                      section.name
                    );
                  }
                }
              );
            });
          }
        });
      });
      // }

      return resolve(Object.values(merged));
    });
  }


  async getCriteriasParentQuesAndInstParentQues(req) {
    return new Promise(async function(resolve, reject) {

      let criteriaQueryResult = await database.models.criterias.find({});

      const questionQueryObject = {
        //responseType: "matrix"
      }
      let questionQueryResult = await database.models[
        "questions"
      ].find(questionQueryObject);

      let result = {
        criteria : new Array(),
        questions : new Array(),
        instanceParentQuestions : new Array()
      }

      questionQueryResult.forEach(question => {
        if (question.responseType == "matrix") { 
          result.instanceParentQuestions.push({
            _id: question._id,
            externalId: question.externalId,
            name: question.question[0]
          })
        } else {
          result.questions.push({
            _id: question._id,
            externalId: question.externalId,
            name: question.question[0]
          })
        }
      })

      criteriaQueryResult.forEach(criteria => {
        result.criteria.push({
          _id: criteria._id,
          externalId: criteria.externalId,
          name: criteria.name
        })
      })

      let responseMessage = "Fetched requested data successfully."

      let response = { message: responseMessage, result: result };
      return resolve(response);

    }).catch(error => {
      reject(error);
    });
  }


  addQuestion(req) {

    req.evidenceObjects = this.getEvidenceObjects()

    return new Promise(async (resolve, reject) => {

      try {
        
        let result = {}

        let question = req.body
        let questionCriteriaId = question.payload.criteriaId
        let questionEvidenceMethod = question.payload.evidenceId
        let questionSection = question.payload.section

        delete question.payload

        let criterias = await database.models.criterias.find({
          externalId : questionCriteriaId
        });

        let questionCriteria
        if(criterias[0].externalId != "") {
          questionCriteria = criterias[0]
        } else {
          throw "No criteria with ID " + questionCriteriaId + " found"
        }

        let questionCollection = {}
        let toFetchQuestionIds = new Array
        toFetchQuestionIds.push(question.externalId)
        if(question.parentId != "") {toFetchQuestionIds.push(question.parentId)}
        if(question.instanceParentId != "") {toFetchQuestionIds.push(question.instanceParentId)}

        let questionsFromDatabase = await database.models.questions.find({
          externalId : { $in: toFetchQuestionIds }
        });

        if(questionsFromDatabase.length > 0) {
          questionsFromDatabase.forEach(question => {
            questionCollection[question.externalId] = question
          })
        }

        if(questionCollection[question.externalId]) {
          throw "The question with the external ID " + question.externalId + " already exists"
        }

        if(question.parentId != "" && !questionCollection[question.parentId]) {
          throw "Parent question with external ID " + question.parentId + " not found"
        }

        if(question.instanceParentId != "" && !questionCollection[question.instanceParentId]) {
          throw "Instance Parent question with external ID " + question.instanceParentId + " not found"
        }

        if(Object.keys(question.visibleIf[0]).length <= 0) {
          question.visibleIf = ""
        } else {
          question.visibleIf[0]._id = questionCollection[question.parentId]._id
        }

        let generatedQuestionDocument = await database.models.questions.create(
          question
        );

        result._id = generatedQuestionDocument._id


        if(question.parentId != "") {
          let queryParentQuestionObject = {
            _id: questionCollection[question.parentId]._id
          }
          let updateParentQuestionObject = {}
          updateParentQuestionObject.$push = { 
            ["children"]: generatedQuestionDocument._id
          }
          await database.models.questions.findOneAndUpdate(
            queryParentQuestionObject,
            updateParentQuestionObject
          )
        }

        if(question.instanceParentId != "") {
          let queryInstanceParentQuestionObject = {
            _id: questionCollection[question.instanceParentId]._id
          }
          let updateInstanceParentQuestionObject = {}
          updateInstanceParentQuestionObject.$push = { 
            ["instanceQuestions"]: generatedQuestionDocument._id
          }
          await database.models.questions.findOneAndUpdate(
            queryInstanceParentQuestionObject,
            updateInstanceParentQuestionObject
          )
        }
      
        let criteriaEvidences = questionCriteria.evidences
        let indexOfEvidenceMethodInCriteria = criteriaEvidences.findIndex( evidence => evidence.externalId === questionEvidenceMethod );

        if(indexOfEvidenceMethodInCriteria < 0) {
          criteriaEvidences.push(req.evidenceObjects[questionEvidenceMethod])
          indexOfEvidenceMethodInCriteria = criteriaEvidences.length - 1
        }

        let indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.findIndex(section => section.name === questionSection)
        if(indexOfSectionInEvidenceMethod < 0) {
          criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.push({name:questionSection, questions: new Array})
          indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.length - 1
        }

        criteriaEvidences[indexOfEvidenceMethodInCriteria].sections[indexOfSectionInEvidenceMethod].questions.push(generatedQuestionDocument._id)

        let queryCriteriaObject = {
          _id: questionCriteria._id
        }
        let updateCriteriaObject = {}
        updateCriteriaObject.$set = { 
          ["evidences"]: criteriaEvidences
        }
        await database.models.criterias.findOneAndUpdate(
          queryCriteriaObject,
          updateCriteriaObject
        )

        let responseMessage = "Question added successfully."

        let response = { message: responseMessage, result: result };

        return resolve(response);
      } catch (error) {
        return reject({message:error});
      }

    })
  }


  getEvidenceObjects () {
    return  {

      "BL": {
        externalId: "BL",
        tip: "Some tip at evidence level.",
        name: "Book Look",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "LW": {
        externalId: "LW",
        tip: "Some tip at evidence level.",
        name: "Learning Walk",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "PI": {
        externalId: "PI",
        tip: "Some tip at evidence level.",
        name: "Principal Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "CO": {
        externalId: "CO",
        tip: "Some tip at evidence level.",
        name: "Classroom Observation",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "TI": {
        externalId: "TI",
        tip: "Some tip at evidence level.",
        name: "Teacher Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "SI": {
        externalId: "SI",
        tip: "Some tip at evidence level.",
        name: "Student Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "AC3" : {
        externalId: "AC3",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 3",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC5": {
        externalId: "AC5",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 5",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC8": {
        externalId: "AC8",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 8",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "PAI": {
        externalId: "PAI",
        tip: "Some tip at evidence level.",
        name: "Parent Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "oncall",
        canBeNotApplicable: false
      }
    }
  }


  async upload(req) {

    return new Promise(async (resolve, reject) => {

      try {
        let criteriaData = await csv().fromString(req.files.criteria.data.toString());

        console.log(criteriaData)
        let programQueryList = {}

        criteriaData.forEach(criteria => {
          programQueryList[criteria.programId] = criteria.programId
        });

        // let submissionsFromDatabase = await database.models.submissions.find({
        //   programId : { $in: Object.values(programsFromDatabase) }
        // }, {
        //   externalId: 1,
        //   name:1
        // });

        let programsFromDatabase = await database.models.programs.find({
          externalId : { $in: Object.values(programQueryList) }
        });
        
        const programsData = programsFromDatabase.reduce( 
          (ac, program) => ({...ac, [program.externalId]: program }), {} )

        console.log(programsData)
        
        criteriaData = await Promise.all(criteriaData.map(async (criteria) => {

          let queryObject = {
            name: criteria.name
          }

          let updateObject = {}

          let queryOptions = {
            queryOptions: true
          }

          updateObject.$set = { 
            rubric : rubric
          }

          criteria = await database.models.criterias.findOneAndUpdate(
            queryObject,
            updateObject,
            queryOptions
          );
          
          return criteria

        }));

        console.log(programsData)
        // if (schoolWiseParentsData.findIndex( school => school === undefined) >= 0) {
        //   throw "Something went wrong, not all records were inserted/updated."
        // }

        let responseMessage = "Criteira updated successfully."

        let response = { message: responseMessage };

        return resolve(response);

      } catch (error) {
        return reject({message:error});
      }

    })
  }


};