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
   * @param {Object} solutionDocument
   * @param {Boolean} [isPageQuestionsRequired=true] - Optional flag to determine if page questions are required.
   * @returns {Object} - return evidence Object.
   */
  static getQuestionSetHierarchy(
    submissionDocumentCriterias,
    solutionDocument,
    isPageQuestionsRequired = true
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const referenceQuestionSetId = solutionDocument?.referenceQuestionSetId;

        const cacheData = await getKey(referenceQuestionSetId).catch((err) => {
          console.log("Error in getting data from Redis:", err);
        });
        //if cache data present
        if (cacheData) {
          resolve({
            success: true,
            message: messageConstants.apiResponses.EVIDENCE_FETCHED,
            data: JSON.parse(cacheData),
          });
        } else {
          // get data from the creation portal
          const res = await readQuestionSet(referenceQuestionSetId).catch(
            (err) => {
              console.log("Error", err?.response?.data);
              reject({
                success: false,
                message: err?.response?.data,
                data: false,
              });
            }
          );

          if (res.body.responseCode !== httpStatusCode.ok.code) {
            return reject({
              message: res.params.errmsg,
              status: httpStatusCode.bad_request.status,
            })
          }

          const questionSetHierarchy =
            res?.result?.questionSet || res?.result?.questionset;

          const migratedCriteriaQuestions =
            questionSetHierarchy?.children || [];
          const evidences = await this.questionEvidences(
            migratedCriteriaQuestions,
            submissionDocumentCriterias,
            isPageQuestionsRequired
          )?.data;

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

          await setKey(
            solutionDocument.referenceQuestionSetId,
            {
              ...evidences,
              evidences: assessmentTemplate.assessment.evidences,
            },
            cacheTtl
          );

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
   *
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

          assessment.page = "p" + (i + 1);

          const children = criteria?.children || [];

          if (isPageQuestionsRequired && children.length > 0) {
            const pageQuestions = await this.getPageQuestions(
              criteria,
              children,
              []
            )?.data;

            const isMatrixQuestion = criteria?.instances?.label;

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
   * @param {Array} children - Array of child question.
   * @param {Array} pageQuestions
   * @returns {Promise<Array>} - Resolves with the updated array of transformed page questions.
   */
  static getPageQuestions(criteria, children, pageQuestions) {
    const readQuestions = [];
    return new Promise((resolve, reject) => {
      const processChild = async (j) => {
        try {
          const res = await readQuestion(children[j]?.identifier);

          if (res.body.responseCode !== httpStatusCode.ok.code) {
            return reject({
              message: res.params.errmsg,
              status: httpStatusCode.bad_request.status,
            })
          }

          let childData = res?.data;
          readQuestions.push(childData);

          // branchingLogic - Branching logic refers to the condition where, if a question has a visibleIf property, we add branching logic. This means that if certain options are selected, new questions are triggered based on the option selected.
          const branching = criteria?.branchingLogic;

          if (!isEmpty(branching) && childData) {
            childData = await this.updateChildDataWithBranching(
              branching,
              childData,
              readQuestions,
              children
            )?.data;
          }

          // question transformation
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
   *
   * @method
   * @name getTemplateType
   * @param {Object} childData - The child question data object.
   * @returns {String} - The determined question template type.
   */
  static getTemplateType(childData) {
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
   *
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
      if (branching.hasOwnProperty(childData?.identifier)) {
        const question = branching[childData.identifier];
        if (question?.target?.length > 0) {
          childData.children = question.target || [];
          childData.options = childData?.interactions?.response1.options;
        } else if (!isEmpty(question?.preCondition)) {
          const operator = Object.keys(question?.preCondition?.and[0]);

          const index = question?.preCondition?.and[0][operator];

          let branchingQuestion = find(readQuestions, {
            identifier: question?.source[0],
          });
          let branchingQuestionId = !isEmpty(branchingQuestion)
            ? branchingQuestion?.identifier
            : "";

          if (!branchingQuestionId) {
            branchingQuestion = find(children, {
              identifier: question?.source[0],
            });
            branchingQuestionId = branchingQuestion?.identifier;
            const res = await readQuestion(branchingQuestionId);
            if (res.body.responseCode !== httpStatusCode.ok.code) {
              return reject({
                message: res.params.errmsg,
                status: httpStatusCode.bad_request.status,
              })
            }
            branchingQuestion = res?.data;
          }

          const i = index[1] === -1 ? 0 : index[1];

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
   *
   * @method
   * @name transformQuestionData
   * @param {Object} childQuestion - The initial child question template.
   * @param {Object} childData - The child question data to be transformed.
   * @param {Number} index - The index of the child question in the list.
   * @param {Object} child - The child question metadata.
   * @returns {Promise<Object>} - Resolves with the transformed question data.
   */
  static transformQuestionData(childQuestion, childData, index, child) {
    const type = this.getTemplateType(childData);

    return new Promise((resolve, reject) => {
      for (let key in questionType[type]) {
        const keyData = questionType[type][key];
        if (questionType.defaultFields.includes(key)) {
          childQuestion[key] = keyData;
        } else if (questionType.arrayFields.includes(key)) {
          childQuestion[key] = childData[keyData] || [];
        } else if (key === "question") {
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

          childQuestion[key] = questionData;
        } else if (key === "validation") {
          const obj = {};
          for (const childrenKey in keyData) {
            if (childrenKey === "required") {
              const require = childData?.interactions?.validation?.required;

              obj[childrenKey] =
                require === true || require === "Yes" || require === "yes"
                  ? true
                  : false;
            } else if (childrenKey === "IsNumber") {
              const typeofChild =
                childData?.interactions?.response1?.type?.number;
              obj[childrenKey] =
                typeofChild.toLowerCase() === "yes" ? true : false;
            } else if (childrenKey === "max" || childrenKey === "min") {
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
          childQuestion[key] = {
            ...keyData,
            criteriaId: childData.identifier,
            responseType: type,
          };
        } else if (key === "file") {
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
          childQuestion[key] = child[keyData];
        } else if (key === "dateFormat") {
          childQuestion[key] =
            childData?.interactions?.response1?.validation?.pattern || "";
        } else if (key === "options") {
          childQuestion[key] =
            childData?.interactions?.response1?.options || [];
        } else if (key === "showRemarks" || key === "autoCapture") {
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
          childQuestion[key] =
            key === "questionNumber" ? `${index + 1}` : baseAssessment.page;
        } else {
          childQuestion[key] = childData[keyData]
            ? childData[keyData]
            : child[keyData]
              ? child[keyData]
              : "";
        }
      }
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
   *
   * @method
   * @name getMatrixQuestions
   * @param {Object} criteria - The criteria object.
   * @returns {Object} - The matrix questions object.
   */
  static getMatrixQuestions(criteria) {
    const matrixObj = {};
    for (let key in questionType.matrix) {
      if (key === "instanceIdentifier") {
        matrixObj["instanceIdentifier"] = criteria?.instances?.label || "";
      } else if (key === "payload") {
        matrixObj[key] = {
          ...questionType.matrix.payload,
          criteriaId: criteria.identifier,
          responseType: "matrix",
        };
      } else if (questionType.arrayFields.includes(key)) {
        matrixObj[key] =
          key !== "children" ? criteria[questionType.matrix[key]] : [];
      } else if (
        questionType.defaultFields.includes(key) ||
        key === "validation"
      ) {
        matrixObj[key] = questionType.matrix[key] || "";
      } else if (key !== "validation") {
        matrixObj[key] = criteria[questionType.matrix[key]] || "";
      }
    }

    return matrixObj;
  }
};
