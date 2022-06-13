module.exports = {
    name: "surveys",
    schema: {
      name: {
        type: String,
        index: true
      },
      description: {
        type: String,
        index: true
      },
      createdBy: {
        type: String,
        index: true,
        required: true
      },
      solutionId: {
        type: "ObjectId",
        index: true,
        required: true
      },
      programId: {
        type: "ObjectId",
        index: true,
      },
      programExternalId: {
        type: String,
        index: true,
      },
      solutionExternalId: {
        type: String,
        index: true,
        required: true
      },
      startDate: Date,
      endDate: Date,
      status: String,
      isDeleted: {
        type: Boolean,
        default: false
      },
      isAPrivateProgram : {
        default : false,
        type : Boolean
      }
    },
    compoundIndex: [
      {
          "name" :{ createdBy: 1, solutionId: 1 },
          "indexType" : { unique: true, partialFilterExpression: { solutionId: { $exists: true }}}
      }
    ]
  };