const baseQuestion = {
    _id: "identifier",                    // String
    question: 'body',                     // String
    isCompleted: false,                   // boolean
    showRemarks: "showRemarks",           // String
    options: "interactions.response1.options",  // String
    sliderOptions: "sliderOptions",       // String
    children: "children",                 // Array<String>
    questionGroup: ["A1"],                // String
    fileName: "fileName",                 // String
    instanceQuestions: "instanceQuestions", // Array<String>
    isAGeneralQuestion: false,            // boolean
    autoCapture: "autocapture",           // String
    allowAudioRecording: false,           // boolean
    prefillFromEntityProfile: false,      // boolean
    entityFieldName: "",                  // String
    isEditable: true,                     // boolean
    showQuestionInPreview: false,         // boolean
    deleted: false,                       // boolean
    remarks: "",                          // String
    value: "",                            // String
    usedForScoring: "",                   // String
    questionType: "auto",                 // String
    canBeNotApplicable: false,            // boolean
    visibleIf: "visibleIf",               // Array<{}>
    validation: {                         // Object
      required: "interactions.validation.required", // String
    },
    file: {                               // Object
      required: true,                     // boolean
      type: "evidence.mimeType",          // Array<String>
      minCount: 0,                        // number
      maxCount: 10,                       // number
      caption: "FALSE",                   // String
    },
    externalId: "code",                   // String
    tip: "",                              // String
    hint: "hints",                        // String
    responseType: "primaryCategory",      // String
    modeOfCollection: "onfield",          // String
    accessibility: "No",                  // String
    rubricLevel: "",                      // String
    sectionHeader: "",                    // String
    page: "",                             // String
    questionNumber: "",                   // String
    updatedAt: "lastUpdatedOn",           // Date
    createdAt: "createdOn",               // Date
    __v: 0,                               // String
    createdFromQuestionId: "",            // String
    evidenceMethod: "OB",                 // String
    payload: {                            // Object
      criteriaId: "sectionId",            // String
      responseType: "primaryCategory",    // String
      evidenceMethod: "OB",               // String
      rubricLevel: "",                    // String
    },
    startTime: "",                        // String
    endTime: "",                          // String
    gpsLocation: "",                      // String
    dateFormat: "",                       // String
    instanceIdentifier: "",               // String
  };
  
  const questionType = {
    text: {
      ...baseQuestion,
      responseType: "text",               // String
    },
    number: {
      ...baseQuestion,
      responseType: "number",             // String
      validation: {
        ...baseQuestion.validation,
        IsNumber: "interactions.response1.type.number", // String
      },
    },
    slider: {
      ...baseQuestion,
      responseType: "slider",             // String
      validation: {
        ...baseQuestion.validation,
        max: "interactions.response1.validation.range.max", // String
        min: "interactions.response1.validation.range.min", // String
      },
    },
    date: {
      ...baseQuestion,
      responseType: "date",               // String
      validation: {
        ...baseQuestion.validation,
        max: "interactions.validation.max", // String
        min: "interactions.validation.min", // String
      },
      dateFormat: "interactions.response1.validation.pattern", // String
    },
    multiselect: {
      ...baseQuestion,
      responseType: "multiselect",        // String
    },
    radio: {
      ...baseQuestion,
      responseType: "radio",              // String
    },
  
    defaultFields: [
      "__v",                              // String
      "responseType",                     // String
      "isCompleted",                      // boolean
      "questionGroup",                    // String
      "isAGeneralQuestion",               // boolean
      "allowAudioRecording",              // boolean
      "prefillFromEntityProfile",         // boolean
      "entityFieldName",                  // String
      "isEditable",                       // boolean
      "showQuestionInPreview",            // boolean
      "deleted",                          // boolean
      "remarks",                          // String
      "value",                            // String
      "usedForScoring",                   // String
      "questionType",                     // String
      "canBeNotApplicable",               // boolean
      "tip",                              // String
      "modeOfCollection",                 // String
      "accessibility",                    // String
      "rubricLevel",                      // String
      "sectionHeader",                    // String
      "_v",                               // String
      "createdFromQuestionId",            // String
      "evidenceMethod",                   // String
      "startTime",                        // String
      "endTime",                          // String
      "gpsLocation",                      // String
    ],
  
    arrayFields: [
      "sliderOptions",                    // Array<String>
      "children",                         // Array<String>
      "fileName",                         // String
      "instanceQuestions",                // Array<String>
    ],
  
    matrix: {
      ...baseQuestion,
      instanceIdentifier: "instances",    // String
      validation: {
        required: true,                   // boolean
      },
      responseType: 'matrix',             // String
    }
  };
  
  module.exports = {
    baseQuestion,
    questionType,
  };
  