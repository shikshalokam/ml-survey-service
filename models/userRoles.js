module.exports = {
    name: "userRoles",
    schema: {
      code: {
        type: String,
        required: true,
        index : true,
        unique : true
      },
      title: {
        type: String,
        required: true
      },
      entityTypes: Array,
      createdBy: String,
      updatedBy: String,
      status: {
        type: String,
        default: "active"
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      isAPlatformRole: {
        type: Boolean,
        default: false
      }
    }
  };
  