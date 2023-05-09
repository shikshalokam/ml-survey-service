module.exports = {
  name: "programs",
  schema: {
    externalId: {
      type : String,
      index : true,
      unique : true
    },
    name: String,
    description: String,
    owner: String,
    createdBy: {
      type : String,
      index : true
    },
    updatedBy: String,
    status: String,
    resourceType: [String],
    language: [String],
    keywords: [String],
    concepts: ["json"],
    imageCompression: {},
    components: ["json"],
    components: ["json"],
    isAPrivateProgram : {
      default : false,
      type : Boolean
    },
    isDeleted: {
      default : false,
      type : Boolean
    },
    scope : {
      entityType : String,
      entities : {
        type : Array,
        index : true
      },
      roles : [{
        _id : "ObjectId",
        code : {
          type : String,
          index : true
        }
      }]
    },
    rootOrganisations : {
      type : Array,
      require : true
    },
    createdFor : Array,
    requestForPIIConsent: Boolean
  }
};
