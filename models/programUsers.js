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
    resourcesStarted: {
      type: Boolean,
      index: true,
      default: false
    },
    userProfile: {
      type : Object,
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
