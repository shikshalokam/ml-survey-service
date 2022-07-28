


const baseQuestion = {
  _id: "identifier",
  question: 'body',
  isCompleted: false,
  showRemarks: "showRemarks",
  options: "interactions.response1.options",
  sliderOptions: "sliderOptions",
  children: "children",
  questionGroup: ["A1"],
  fileName: "fileName",
  instanceQuestions: "instanceQuestions",
  isAGeneralQuestion: false,
  autoCapture: "autocapture",
  allowAudioRecording: false,
  prefillFromEntityProfile: false,
  entityFieldName: "",
  isEditable: true,
  showQuestionInPreview: false,
  deleted: false,
  remarks: "",
  value: "",
  usedForScoring: "",
  questionType: "auto",
  canBeNotApplicable: false,
  visibleIf: "visibleIf",
  validation: {
    required: "interactions.validation.required",
  },
  file: {
    required: true,
    type: "evidence.mimeType",
    minCount: 0,
    maxCount: 10,
    caption: "FALSE",
  },
  externalId: "code",
  tip: "",
  hint: "hints",
  responseType: "primaryCategory",
  modeOfCollection: "onfield",
  accessibility: "No",
  rubricLevel: "",
  sectionHeader: "",
  page: "",
  questionNumber: "",
  updatedAt: "lastUpdatedOn",
  createdAt: "createdOn",
  __v: 0,
  createdFromQuestionId: "",
  evidenceMethod: "OB",
  payload: {
    criteriaId: "sectionId",
    responseType: "primaryCategory",
    evidenceMethod: "OB",
    rubricLevel: "",
  },
  startTime: "",
  endTime: "",
  gpsLocation: "",
  dateFormat: "",
  instanceIdentifier: "",
};

const questionType = {
  text: {
    ...baseQuestion,
    responseType: "text",
  },
  number: {
    ...baseQuestion,
    responseType: "number",
    validation: {
      ...baseQuestion.validation,
      IsNumber: "interactions.response1.type.number",
    },
  },
  slider: {
    ...baseQuestion,
    responseType: "slider",
    validation: {
      ...baseQuestion.validation,
      max: "interactions.response1.validation.range.max",
      min: "interactions.response1.validation.range.min",
    },
  },
  date: {
    ...baseQuestion,
    responseType: "date",
    validation: {
      ...baseQuestion.validation,
      max: "interactions.validation.max",
      min: "interactions.validation.min",
    },
    dateFormat: "interactions.response1.validation.pattern",
  },
  multiselect: {
    ...baseQuestion,
    responseType: "multiselect",
  },
  radio: {
    ...baseQuestion,
    responseType: "radio",
  },

  defaultFields: [
    "__v",
    "responseType",
    "isCompleted",
    "questionGroup",
    "isAGeneralQuestion",
    "allowAudioRecording",
    "prefillFromEntityProfile",
    "entityFieldName",
    "isEditable",
    "showQuestionInPreview",
    "deleted",
    "remarks",
    "value",
    "usedForScoring",
    "questionType",
    "canBeNotApplicable",
    "tip",
    "modeOfCollection",
    "accessibility",
    "rubricLevel",
    "sectionHeader",
    "_v",
    "createdFromQuestionId",
    "evidenceMethod",
    "startTime",
    "endTime",
    "gpsLocation",
  ],

  arrayFields: ["sliderOptions", "children", "fileName", "instanceQuestions"],

  matrix: {
    ...baseQuestion,
    instanceIdentifier: "instances",
    validation: {
      required: true
    },
    responseType: 'matrix',
  }

};

module.exports = {
  baseQuestion,
  questionType,
};
