module.exports = {
  name: "observationSubmissions",
  schema: {
    entityId: {
      type : String,
      index : true
    },
    observationId: {
      type : "ObjectId",
      index : true
    },
    createdBy: {
      type : String,
      index : true
    },
    status: {
      type: String,
      required: true
    },
    evidencesStatus: Array,
    evidences: Object,
    criteria: Array,
    themes: Array,
    answers: Object,
    entityExternalId: {
      type : String,
      index : true
    },
    entityInformation: Object,
    observationInformation: Object,
    entityProfile: Object,
    feedback: Array,
    generalQuestions: Object,
    ratingCompletedAt: Date,
    completedDate: {
      type : Date,
      index : true
    },
    solutionId: {
      type : "ObjectId",
      index : true
    },
    solutionExternalId: {
      type : String,
      index : true
    },
    submissionsUpdatedHistory: Array,
    entityTypeId: {
      type : "ObjectId",
      index : true
    },
    entityType: {
      type : String,
      index : true
    },
    programId: {
      type: "ObjectId",
      required: true
    },
    programExternalId: {
      type: String,
      required: true
    },
    submissionNumber: {
      type : Number,
      index : true
    },
    pointsBasedMaxScore : { type : Number, default: 0 },
    pointsBasedScoreAchieved : { type : Number, default: 0 },
    pointsBasedPercentageScore : { type : Number, default: 0 },
    title : { 
      type : String,
      default: function() {
        if (this.submissionNumber && this.submissionNumber > 0) {
          return "Observation "+this.submissionNumber;
        } else {
          return "Observation";
        }
      }
    },
    isAPrivateProgram : {
      default : false,
      type : Boolean
    },
    scoringSystem: String,
    isRubricDriven: { type : Boolean, default: false },
    project : Object,
    referenceFrom : String,
    appInformation : Object,
    userRoleInformation : Object,
    criteriaLevelReport : Boolean,
    userProfile : Object
  },
  compoundIndex: [
    {
      "name" :{ observationId: 1, entityId: 1, submissionNumber:1 },
      "indexType" : { unique: true }
    }
  ]
};
