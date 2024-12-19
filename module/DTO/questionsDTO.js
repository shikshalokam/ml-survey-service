// Dependencies.
const { isEmpty, find, capitalize } = require("lodash");
const { readQuestionSet, readQuestion } = require(ROOT_PATH +
  "/generics/services/knowledge-platform");
const { questionType } = require(MODULES_BASE_PATH +
  "/questions/questionTemplate");
const { criteriaTemplate, defaultCriteria } = require(MODULES_BASE_PATH +
  "/criteria/criteriaTemplate");
const { baseAssessment, assessmentTemplate } = require(MODULES_BASE_PATH +
  "/assessments/assessmentTemplate");
const { setKey, getKey } = require(ROOT_PATH +
  "/generics/redis-communication")


module.exports = class Transformation {
  /**
   * Fetches the question set hierarchy for a solution and handles evidence generation.
   * Caches the result if not already cached.
   * @method
   * @name getQuestionSetHierarchy
   * @param {Object} submissionDocumentCriterias - Criteria from the submission document to process the question set.
   * @param {Object} solutionDocument - The solution document containing reference question set ID.
   * @param {Boolean} [isPageQuestionsRequired=true] - Optional flag to determine if page questions are required.
   * @returns {Object} - Returns an object containing evidence data.
   */
  static getQuestionSetHierarchy(
    submissionDocumentCriterias,
    solutionDocument,
    isPageQuestionsRequired = true
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        // Extract the reference question set ID from the solution document
        const referenceQuestionSetId = solutionDocument?.referenceQuestionSetId;

        // Attempt to retrieve cached data using the reference question set ID
        const cacheData = await getKey(referenceQuestionSetId).catch((err) => {
          console.log("Error in getting data from Redis:", err);
        });

        // If cache data is present, resolve with the cached evidence data
        if (cacheData) {
          resolve({
            success: true,
            message: messageConstants.apiResponses.EVIDENCE_FETCHED,
            data: JSON.parse(cacheData),
          });
        } else {
          // Retrieve data from the creation portal if no cache is found
          const res = await readQuestionSet(referenceQuestionSetId);

          if (res.responseCode !== httpStatusCode.ok.code) {
            return reject({
              success: false,
              message: res.params.errmsg,
              status: httpStatusCode.bad_request.status,
            });
          }

          // Extract the question set hierarchy from the response
          const questionSetHierarchy =
            res?.result?.questionSet || res?.result?.questionset;

          // Gather questions from the hierarchy based on the criteria provided
          const migratedCriteriaQuestions =
            questionSetHierarchy?.children || [];
          const evidences = await this.questionEvidences(
            migratedCriteriaQuestions,
            submissionDocumentCriterias,
            isPageQuestionsRequired
          )?.data;

          // Format the assessment template with relevant evidence data
          assessmentTemplate.assessment.evidences[0].name = capitalize(
            solutionDocument?.type
          );
          assessmentTemplate.assessment.evidences[0].sections[0].name = `${capitalize(
            solutionDocument?.type
          )} Questions`;
          assessmentTemplate.assessment.evidences[0].sections[0].questions =
            evidences?.evidenceSections || [];
          assessmentTemplate.assessment.evidences[0].sections[0].code = "SQ";
          assessmentTemplate.assessment.evidences[0].code =
            assessmentTemplate.assessment.evidences[0].externalId = "SF";
          assessmentTemplate.assessment.evidences[0].description =
            questionSetHierarchy?.description || "";

          // Cache the formatted evidence data
          await setKey(
            solutionDocument.referenceQuestionSetId,
            {
              ...evidences,
              evidences: assessmentTemplate.assessment.evidences,
            },
            cacheTtl
          );

          // Resolve with the formatted evidence data
          resolve({
            success: true,
            message: messageConstants.apiResponses.EVIDENCE_FETCHED,
            data: {
              ...evidences,
              evidences: assessmentTemplate.assessment.evidences,
            },
          });
        }
      } catch (error) {
        // Handle any errors that occur during the process
        return reject({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Processes criteria questions and generates evidence sections.
   * @method
   * @name questionEvidences
   * @param {Array} criteriaQuestions - Array of criteria questions.
   * @param {Array} submissionDocumentCriterias - Array of submission document criteria objects to update.
   * @param {Boolean} isPageQuestionsRequired - Flag to determine if page questions are required for each criteria.
   * @returns {Promise<Object>} - Resolves with an object containing evidence sections and updated submission document criteria.
   */
  static questionEvidences(
    criteriaQuestions,
    submissionDocumentCriterias,
    isPageQuestionsRequired
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const evidenceSections = [];
        for (let i = 0; i < criteriaQuestions.length; i++) {
          const criteria = criteriaQuestions[i];
          const assessment = { ...baseAssessment };
          const criteriaObj = {};

          // Populate criteria object with necessary data
          for (let key in criteriaTemplate) {
            if (key === messageConstants.common.CREATED_FOR) {
              criteriaObj[key] = criteria[criteriaTemplate[key]]
                ? [criteria[criteriaTemplate[key]]]
                : [];
            } else if (defaultCriteria.includes(key)) {
              criteriaObj[key] = criteriaTemplate[key];
            } else if (!isEmpty(criteriaTemplate[key])) {
              criteriaObj[key] = criteria[criteriaTemplate[key]] || "";
            }
          }

          // Assign a page identifier to the assessment
          assessment.page = "p" + (i + 1);

          const children = criteria?.children || [];

          // Process page questions if required
          if (isPageQuestionsRequired && children.length > 0) {
            const pageQuestions = await this.getPageQuestions(
              criteria,
              children,
              []
            )?.data;

            const isMatrixQuestion = criteria?.instances?.label;

          // If current question is matrix type, add associated matrix questions to pageQuestions
            let matrixQuestion = {};
            if (isMatrixQuestion) {
              matrixQuestion = this.getMatrixQuestions(criteria);
              matrixQuestion.instanceQuestions = pageQuestions;
              assessment.pageQuestions = matrixQuestion;
            } else {
              assessment.pageQuestions = pageQuestions;
            }
          }
          submissionDocumentCriterias.push(criteriaObj);
          if (children.length > 0) evidenceSections.push(assessment);
        }
        // Resolve with the evidence sections and updated criteria
        resolve({
          success: true,
          message: messageConstants.apiResponses.EVIDENCE_FETCHED,
          data: {
            evidenceSections,
            submissionDocumentCriterias,
          },
        });
      } catch (error) {
        return reject({
          success: false,
          message: error.message,
          data: false,
        });
      }
    });
  }

  /**
   * Processes child questions for a given criteria and updates page questions with transformed data.
   * @method
   * @name getPageQuestions
   * @param {Object} criteria - The criteria object.
   * @param {Array} children - Array of child questions.
   * @param {Array} pageQuestions - Array to store transformed page questions.
   * @returns {Promise<Array>} - Resolves with the updated array of transformed page questions.
   */
  static getPageQuestions(criteria, children, pageQuestions) {
    const readQuestions = [];
    return new Promise((resolve, reject) => {
      const processChild = async (j) => {
        try {
          // Read question data for each child
          const res = await readQuestion(children[j]?.identifier);

          if (res.responseCode !== httpStatusCode.ok.code) {
            return reject({
              success: false,
              message: res.params.errmsg,
              status: httpStatusCode.bad_request.status,
            });
          }

          let childData = res?.data;
          readQuestions.push(childData);

          // Apply branching logic if applicable
          const branching = criteria?.branchingLogic;

          if (!isEmpty(branching) && childData) {
            childData = await this.updateChildDataWithBranching(
              branching,
              childData,
              readQuestions,
              children
            )?.data;
          }

          // Transform question data
          const childTemplate = await this.transformQuestionData(
            {},
            childData,
            j,
            children[j]
          )?.data;

          pageQuestions.push(childTemplate);
        } catch (error) {
          reject({
            success: false,
            message: `Error processing child at index ${j}: ${error.message}`,
            data: false,
          });
        }
      };

      const processAllChildren = async () => {
        for (let j = 0; j < children.length; j++) {
          await processChild(j);
        }
        // Resolve with the transformed page questions
        resolve({
          success: true,
          message: messageConstants.apiResponses.PAGE_QUESTION_FETCHED,
          data: {
            ...pageQuestions,
          },
        });
      };

      processAllChildren();
    });
  }

  /**
   * Retrieves the template type of a given question.
   * @method
   * @name getTemplateType
   * @param {Object} childData - The child question data object.
   * @returns {String} - The determined question template type.
   */
  static getTemplateType(childData) {
    // Determine the question type based on the primary category - text, number , multiselect, radio, single choice ext.
    const responseType = childData?.primaryCategory?.toLowerCase();
    let type = "";
    if (responseType === "text") {
      type =
        childData?.intractions.response1.type.number.toLowerCase() === "yes"
          ? "number"
          : "text";
    } else if (responseType === "multiselect multiple choice question") {
      type =
        childData?.responseDeclaration?.response1?.cardinality.toLowerCase() ===
          "single"
          ? "radio"
          : "multiselect";
    } else {
      type = responseType;
    }
    return type;
  }

  /**
   * Updates the child data with branching.
   * @method
   * @name updateChildDataWithBranching
   * @param {Object} branching - The branching logic object.
   * @param {Object} childData - The child question data to be updated.
   * @param {Array} readQuestions - Array of questions.
   * @param {Array} children - Array of child questions.
   * @returns {Promise<Object>} - Resolves with the updated child question data.
   */
  static updateChildDataWithBranching(
    branching,
    childData,
    readQuestions,
    children
  ) {
    return new Promise(async (resolve, reject) => {
      // Check if the current child has branching logic
      if (branching.hasOwnProperty(childData?.identifier)) {
        const question = branching[childData.identifier];
        if (question?.target?.length > 0) {
          // Set target children and options if branching targets exist
          childData.children = question.target || [];
          childData.options = childData?.interactions?.response1.options;
        } else if (!isEmpty(question?.preCondition)) {
          // Handle preconditions for branching
          const operator = Object.keys(question?.preCondition?.and[0]);

          const index = question?.preCondition?.and[0][operator];

          // extract branching question
          let branchingQuestion = find(readQuestions, {
            identifier: question?.source[0],
          });

          let branchingQuestionId = !isEmpty(branchingQuestion)
            ? branchingQuestion?.identifier
            : "";
          
          // if branchingQuestionId not present the check into children Question
          if (!branchingQuestionId) {
            branchingQuestion = find(children, {
              identifier: question?.source[0],
            });
            branchingQuestionId = branchingQuestion?.identifier;

            // fetch all the question related to brach
            const res = await readQuestion(branchingQuestionId);
            if (res.responseCode !== httpStatusCode.ok.code) {
              return reject({
                message: res.params.errmsg,
                status: httpStatusCode.bad_request.status,
              });
            }
            branchingQuestion = res?.data;
          }

          const i = index[1] === -1 ? 0 : index[1];

          // Define visibility conditions based on branching logic
          const visibleIf = [
            {
              operator: operator[0] === "eq" ? "===" : "!==",
              value: [
                branchingQuestion?.interactions?.response1.options[i]?.value,
              ],
              _id: question?.source[0],
            },
          ];
          childData.visibleIf = visibleIf || [];
        }
        resolve({
          success: true,
          message: messageConstants.apiResponses.EVIDENCE_FETCHED,
          data: {
            ...childData,
          },
        });
      }
      resolve({
        success: true,
        message: messageConstants.apiResponses.EVIDENCE_FETCHED,
        data: {
          ...childData,
        },
      });
    });
  }

  /**
   * Transformation of the question.
   * @method
   * @name transformQuestionData
   * @param {Object} childQuestion - The initial child question template.
   * @param {Object} childData - The child question data to be transformed.
   * @param {Number} index - The index of the child question in the list.
   * @param {Object} child - The child question metadata.
   * @returns {Promise<Object>} - Resolves with the transformed question data.
   */
  static transformQuestionData(childQuestion, childData, index, child) {
    // Determine the question type
    const type = this.getTemplateType(childData);

    return new Promise((resolve, reject) => {
      for (let key in questionType[type]) {
        const keyData = questionType[type][key];
        if (questionType.defaultFields.includes(key)) {
          // Assign default fields
          childQuestion[key] = keyData;
        } else if (questionType.arrayFields.includes(key)) {
          // Assign array fields related to question type
          childQuestion[key] = childData[keyData] || [];
        } else if (key === "question") {
          // Extract and clean question text
          const questionData = [];
          let str = childData[keyData] ? childData[keyData] : "";
          while (str.length > 0) {
            const startIndex = str.indexOf("<p>");
            if (startIndex > -1) {
              const start = str.slice(startIndex + 3);
              const endIndex = start.indexOf("</p>");
              let end = start.slice(0, endIndex);

              end = end.replace("&nbsp", "");

              questionData.push(end);

              str = start.slice(endIndex);
            } else str = "";
          }

          // Assign the processed question data to the specified key in the childQuestion object
          childQuestion[key] = questionData;
        } else if (key === "validation") {
          // Handle validation logic
          const obj = {};
          for (const childrenKey in keyData) {
            if (childrenKey === "required") {
              // modified datatype string to common boolean 
              const require = childData?.interactions?.validation?.required;

              obj[childrenKey] =
                require === true || require === "Yes" || require === "yes"
                  ? true
                  : false;
            } else if (childrenKey === "IsNumber") {
              // modified datatype string to common boolean 
              const typeofChild =
                childData?.interactions?.response1?.type?.number;
              obj[childrenKey] =
                typeofChild.toLowerCase() === "yes" ? true : false;
            } else if (childrenKey === "max" || childrenKey === "min") {
              // add  common timer to both slider and date question type
              const slider =
                type === "slider"
                  ? childData?.interactions.response1.validation.range[
                  childrenKey
                  ]
                  : type === "date"
                    ? childData?.interactions.validation[childrenKey]
                    : "";
              obj[childrenKey] = slider;
            }
          }
          childQuestion[key] = obj;
        } else if (key === "payload") {
          // Assign payload data
          childQuestion[key] = {
            ...keyData,
            criteriaId: childData.identifier,
            responseType: type,
          };
        } else if (key === "file") {
          // Handle file-related data
          if (
            childData[keyData["type"]] &&
            childData[keyData["type"]].length > 0
          ) {
            const require = childData?.interactions?.validation?.required;
            childQuestion[key] = {
              ...keyData,
              required:
                require === true || require === "Yes" || require === "yes"
                  ? "Yes"
                  : "No",
              type: childData?.evidence?.type,
            };
          } else childQuestion[key] = "";
        } else if (key === "updatedAt" || key === "createdAt") {
          // Assign timestamps
          childQuestion[key] = child[keyData];
        } else if (key === "dateFormat") {
          // Assign date format
          childQuestion[key] =
            childData?.interactions?.response1?.validation?.pattern || "";
        } else if (key === "options") {
          // Assign options
          childQuestion[key] =
            childData?.interactions?.response1?.options || [];
        } else if (key === "showRemarks" || key === "autoCapture") {
          // Handle boolean fields
          const typeofChildren = childData[keyData];
          childQuestion[key] =
            key !== "autoCapture"
              ? typeofChildren === true ||
                typeofChildren === "Yes" ||
                typeofChildren === "yes"
                ? true
                : false
              : childData[keyData] || false;
        } else if (key === "questionNumber" || key === "page") {
          // Assign question number and page
          childQuestion[key] =
            key === "questionNumber" ? `${index + 1}` : baseAssessment.page;
        } else {
          // Assign other fields
          childQuestion[key] = childData[keyData]
            ? childData[keyData]
            : child[keyData]
              ? child[keyData]
              : "";
        }
      }
      // Resolve with the transformed question data
      resolve({
        success: true,
        message: messageConstants.apiResponses.EVIDENCE_FETCHED,
        data: {
          ...childQuestion,
        },
      });
    });
  }

  /**
   * Generates matrix questions based on the criteria.
   * @method
   * @name getMatrixQuestions
   * @param {Object} criteria - The criteria object.
   * @returns {Object} - The matrix questions object.
   */
  static getMatrixQuestions(criteria) {
    const matrixObj = {};
    for (let key in questionType.matrix) {
      if (key === "instanceIdentifier") {
        // Assign instance identifier
        matrixObj["instanceIdentifier"] = criteria?.instances?.label || "";
      } else if (key === "payload") {
        // Assign payload data
        matrixObj[key] = {
          ...questionType.matrix.payload,
          criteriaId: criteria.identifier,
          responseType: "matrix",
        };
      } else if (questionType.arrayFields.includes(key)) {
        // Assign array fields
        matrixObj[key] =
          key !== "children" ? criteria[questionType.matrix[key]] : [];
      } else if (
        questionType.defaultFields.includes(key) ||
        key === "validation"
      ) {
        // Assign default fields and validation
        matrixObj[key] = questionType.matrix[key] || "";
      } else if (key !== "validation") {
        // Assign other fields
        matrixObj[key] = criteria[questionType.matrix[key]] || "";
      }
    }

    return matrixObj;
  }
};
