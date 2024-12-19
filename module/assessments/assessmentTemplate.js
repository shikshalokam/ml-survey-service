// The baseAssessment is used for creating the evidence of the solution, 
// which is further utilized for generating the question set hierarchy
const baseAssessment = {
    _id: "",                          // string
    question: "",                     // string
    isCompleted: "",                  // string
    showRemarks: "",                  // string
    options: "",                      // string
    sliderOptions: "",                // string
    children: "",                     // string
    questionGroup: "",                // string
    fileName: "",                     // string
    instanceQuestions: "",            // string
    isAGeneralQuestion: "",           // string
    autoCapture: "",                  // string
    allowAudioRecording: "",          // string
    prefillFromEntityProfile: "",     // string
    entityFieldName: "",              // string
    isEditable: "",                   // string
    showQuestionInPreview: "",        // string
    deleted: "",                      // string
    remarks: "",                      // string
    value: "",                        // string
    usedForScoring: "",               // string
    questionType: "",                 // string
    canBeNotApplicable: "",           // string
    visibleIf: "",                    // string
    validation: "",                   // string
    file: "",                         // string
    externalId: "",                   // string
    tip: "",                          // string
    hint: "",                         // string
    responseType: "pageQuestions",    // string
    modeOfCollection: "",             // string
    accessibility: "",                // string
    rubricLevel: "",                  // string
    sectionHeader: "",                // string
    page: "p1",                       // string
    questionNumber: "",               // string
    updatedAt: "",                    // string
    createdAt: "",                    // string
    __v: "",                          // string
    createdFromQuestionId: "",        // string
    evidenceMethod: "",               // string
    payload: "",                      // string
    startTime: "",                    // string
    endTime: "",                      // string
    gpsLocation: "",                  // string
    dateFormat: "",                   // string
    instanceIdentifier: "",           // string
    pageQuestions: [],                // array
};


// The baseAssessment is used for creating the evidence of the solution, 
// which is further utilized for generating the question set hierarchy
const assessmentTemplate = {
    assessment: {
        evidences: [                     // Array<{}>
            {
                code: "OB",              // string
                sections: [              // Array<{}>
                    {
                        code: "S1",      // string
                        questions: [],   // Array<{}>
                        name: "type Questions",  // string
                    },
                ],
                externalId: "OB",        // string
                tip: null,               // string
                name: "name",            // string
                description: null,       // string
                modeOfCollection: "onfield",  // string
                canBeNotApplicable: false,    // boolean
                notApplicable: false,         // boolean
                canBeNotAllowed: false,       // boolean
                remarks: null,           // string
                startTime: "",           // string
                endTime: "",             // string
                isSubmitted: false,      // boolean
                submissions: [],         // Array
            },
        ],
    },
};

module.exports = {
    baseAssessment,
    assessmentTemplate,
};