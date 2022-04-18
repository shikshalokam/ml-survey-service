module.exports = {
    name: "surveySubmissions",
    schema: {
      surveyId: {
        type: "ObjectId",
        index: true,
        required: true
      },
      createdBy: {
        type: String,
        index: true,
        required: true
      },
      status: {
        type: String,
        index: true
      },
      evidencesStatus: Array,
      evidences: Object,
      criteria: Array,
      answers: Object,
      completedDate: Date,
      solutionId: {
        type: "ObjectId",
        index: true,
        required: true
      },
      solutionExternalId: {
        type: String,
        index: true,
        required: true
      },
      programId: {
        type: "ObjectId",
        index: true
      },
      programExternalId: {
        type: String,
        index: true
      },
      isAPrivateProgram : {
        default : false,
        type : Boolean,
        index: true
      },
      surveyInformation: Object,
      appInformation : Object,
      userRoleInformation : Object,
      userProfile : Object
    }
  };

