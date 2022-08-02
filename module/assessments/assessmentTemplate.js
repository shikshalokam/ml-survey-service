const baseAssessment = {
  // string
  _id: "",                           
  // string
  question: "",                      
  // string
  isCompleted: "",                   
  // string
  showRemarks: "",                   
  // string
  options: "",                       
  // string
  sliderOptions: "",                 
  // string
  children: "",                      
  // string
  questionGroup: "",                 
  // string
  fileName: "",                      
  // string
  instanceQuestions: "",             
  // string
  isAGeneralQuestion: "",                     
  // string
  autoCapture: "",                      
  // string
  allowAudioRecording: "",              
  // string
  prefillFromEntityProfile: "",         
  // string
  entityFieldName: "",                  
  // string
  isEditable: "",                      
  // string
  showQuestionInPreview: "",            
  // string
  deleted: "",
  // string
  remarks: "",
  // string
  value: "",
  // string
  usedForScoring: "",
  // string
  questionType: "",
  // string
  canBeNotApplicable: "",
  // string
  visibleIf: "",
  // string
  validation: "",
  // string
  file: "",
  // string
  externalId: "",
  // string
  tip: "",
  // string
  hint: "",
  // string
  responseType: "pageQuestions",
  // string
  modeOfCollection: "",
  // string
  accessibility: "",
  // string
  rubricLevel: "",
  // string
  sectionHeader: "",
  // string
  page: "p1",
  // string
  questionNumber: "",
  // string
  updatedAt: "",
  // string
  createdAt: "",
  // string
  __v: "",
  // string
  createdFromQuestionId: "",
  // string
  evidenceMethod: "",
  // string
  payload: "",
  // string
  startTime: "",
  // string
  endTime: "",
  // string
  gpsLocation: "",
  // string
  dateFormat: "",
  // string
  instanceIdentifier: "",
  // array
  pageQuestions: [],
};

const assessmentTemplate = {
  assessment: {
    // Array<{}>
    evidences: [
      {
        // string
        code: "OB",
        // Array<{}>
        sections: [
          {
            // string
            code: "S1",
            // Array<{}>
            questions: [],
            // string
            name: "type Questions",
          },
        ],
        // string
        externalId: "OB",
        // string
        tip: null,
        // string
        name: "name",
        // string
        description: null,
        // string
        modeOfCollection: "onfield",
        // boolean
        canBeNotApplicable: false,
        // boolean
        notApplicable: false,
        // boolean
        canBeNotAllowed: false,
        // string
        remarks: null,
        // string
        startTime: "",
        // string
        endTime: "",
        // boolean
        isSubmitted: false,
        // Array
        submissions: [],
      },
    ],
  },
};

module.exports = {
  baseAssessment,
  assessmentTemplate,
};
