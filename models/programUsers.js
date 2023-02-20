module.exports = {
  name: "programUsers",
  schema: {
    programId: {
      type : "ObjectId",
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    noOfResourcesStarted: {
      type:Number,
      index: true,
      default: 0
    },
    userProfile: {
      type : "ObjectId",
      required: true
    },
    userRoleInformation: Object,
    appInformation: Object
  },
  compoundIndex: [
      {
          "name" :{ userId: 1, programId: 1 },
          "indexType" : { unique: true }
      }
    ]
};
