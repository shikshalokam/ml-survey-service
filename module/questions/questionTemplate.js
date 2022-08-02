const baseQuestion = {
  // String
  _id: "identifier",
  // String
  question: 'body',
  // boolean
  isCompleted: false,
  // String
  showRemarks: "showRemarks",
  // String
  options: "interactions.response1.options",
  // String
  sliderOptions: "sliderOptions",
  // Array<String>
  children: "children",
  // String
  questionGroup: ["A1"],
  // String
  fileName: "fileName",
  // Array<String>
  instanceQuestions: "instanceQuestions",
  // boolean
  isAGeneralQuestion: false,
  // String
  autoCapture: "autocapture",
  // boolean
  allowAudioRecording: false,
  // boolean
  prefillFromEntityProfile: false,
  // String
  entityFieldName: "",
  // boolean
  isEditable: true,
  // boolean
  showQuestionInPreview: false,
  // boolean
  deleted: false,
  // String
  remarks: "",
  // String
  value: "",
  // String
  usedForScoring: "",
  // String
  questionType: "auto",
  // boolean
  canBeNotApplicable: false,
  // Array<{}>
  visibleIf: "visibleIf",
  // Object
  validation: {
    // String
    required: "interactions.validation.required",
  },
  // Object
  file: {
    // boolean
    required: true,
    // Array<String>
    type: "evidence.mimeType",
    // number
    minCount: 0,
    // number
    maxCount: 10,
    // String
    caption: "FALSE",
  },
  // String
  externalId: "code",
  // String
  tip: "",
  // String
  hint: "hints",
  // String
  responseType: "primaryCategory",
  // String
  modeOfCollection: "onfield",
  // String
  accessibility: "No",
  // String
  rubricLevel: "",
  // String
  sectionHeader: "",
  // String
  page: "",
  // String
  questionNumber: "",
  // Date
  updatedAt: "lastUpdatedOn",
  // Date
  createdAt: "createdOn",
  // String
  __v: 0,
  // String
  createdFromQuestionId: "",
  // String
  evidenceMethod: "OB",
  // Object
  payload: {
    // String
    criteriaId: "sectionId",
    // String
    responseType: "primaryCategory",
    // String
    evidenceMethod: "OB",
    // String
    rubricLevel: "",
  },
  // String
  startTime: "",
  // String
  endTime: "",
  // String
  gpsLocation: "",
  // String
  dateFormat: "",
  // String
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
