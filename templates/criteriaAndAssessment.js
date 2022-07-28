
const baseAssessment = {
  _id: "",
  question: "",
  isCompleted: "",
  showRemarks: "",
  options: "",
  sliderOptions: "",
  children: "",
  questionGroup: "",
  fileName: "",
  instanceQuestions: "",
  isAGeneralQuestion: "",
  autoCapture: "",
  allowAudioRecording: "",
  prefillFromEntityProfile: "",
  entityFieldName: "",
  isEditable: "",
  showQuestionInPreview: "",
  deleted: "",
  remarks: "",
  value: "",
  usedForScoring: "",
  questionType: "",
  canBeNotApplicable: "",
  visibleIf: "",
  validation: "",
  file: "",
  externalId: "",
  tip: "",
  hint: "",
  responseType: "pageQuestions",
  modeOfCollection: "",
  accessibility: "",
  rubricLevel: "",
  sectionHeader: "",
  page: "p1",
  questionNumber: "",
  updatedAt: "",
  createdAt: "",
  __v: "",
  createdFromQuestionId: "",
  evidenceMethod: "",
  payload: "",
  startTime: "",
  endTime: "",
  gpsLocation: "",
  dateFormat: "",
  instanceIdentifier: "",
  pageQuestions: [],
  
};

const assessmentTemplate = {
  assessment: {
    evidences: [
      {
        code: "OB",
        sections: [
          {
            code: "S1",
            questions: [],
            name: "type Questions",
          },
        ],
        externalId: "OB",
        tip: null,
        name: "name",
        description: null,
        modeOfCollection: "onfield",
        canBeNotApplicable: false,
        notApplicable: false,
        canBeNotAllowed: false,
        remarks: null,
        startTime: "",
        endTime: "",
        isSubmitted: false,
        submissions: [],
      },
    ],
  },
};


const criteriaTemplate = {
  _id: "identifier",
  __v: 0,
  createdAt: "createdOn",
  createdFor: "channel",
  criteriaType: "manual",
  description: "description",
  externalId: "code",
  flag: "",
  frameworkCriteriaId: "identifier",
  name: "name",
  owner: "consumerId",
  remarks: "",
  score: "",
  showRemarks: "showRemarks",
  timesUsed: "",
  updatedAt: "lastUpdatedOn",
  weightage: "",
  migratedId: "identifier",
  rubric: {},
};

const defaultCriteria = ["__v", "criteriaType", "flag","remarks", "score", "timesUsed", "weightage", "rubric"]

module.exports = {
  baseAssessment,
  assessmentTemplate,
  criteriaTemplate,
  defaultCriteria
};
