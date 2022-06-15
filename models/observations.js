module.exports = {
  name: "observations",
  schema: {
    name: {
      type : String,
      index : true
    },
    description: {
      type : String,
      index : true
    },
    createdBy: {
      type : String,
      index : true
    },
    frameworkId: "ObjectId",
    frameworkExternalId: String,
    solutionId: {
      type : "ObjectId",
      index : true
    },
    programId: {
      type: "ObjectId",
      required: true,
      index : true
    },
    programExternalId: {
      type: String,
      required: true,
      index : true
    },
    solutionExternalId: {
      type : String,
      index : true
    },
    startDate: Date,
    endDate: Date,
    status: {
      type : String,
      index : true
    },
    entityTypeId: {
      type : "ObjectId",
      index : true
    },
    entityType : String,
    entities: Array,
    isAPrivateProgram : {
      default : false,
      type : Boolean,
      index: true
    },
    link: {
      type: String,
      index: true
    },
    project : Object,
    referenceFrom : {
      type: String,
      index: true
    },
    userRoleInformation : Object,
    userProfile : Object,
    deleted : {
      type : Boolean,
      index: true
    }
  },
  compoundIndex: [
    {
        "name" :{ createdBy: 1, solutionId: 1 },
        "indexType" : { unique: true }
    }
  ]
};