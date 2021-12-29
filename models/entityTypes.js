module.exports = {
  name: "entityTypes",
  schema: {
    name: String,
    regsitryDetails: Object,
    profileForm: Array,
    profileFields: Array,
    types: Array,
    callResponseTypes: Array,
    isObservable: Boolean,
    toBeMappedToParentEntities: Boolean,
    isDeleted: Boolean,
    createdBy: String,
    updatedBy: String
  }
};
