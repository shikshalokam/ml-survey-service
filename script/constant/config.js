require("dotenv").config();

const CONFIG = {
  DB: {
    DB_HOST: process.env.MONGODB_URL,
    DB_NAME: process.env.DB_NAME,
    TABLES: {
      solutions: "solutions",
      criteriaQuestions: "criteriaQuestions",
      questions: "questions",
    },
  },
  SUNBIRD: {
    HOST: {
      sunbird: process.env.SUNBIRD_HOST,
      vdn: process.env.VDN_HOST
    },
    APIS: {
      token: "auth/realms/sunbird/protocol/openid-connect/token",
      read_user: "api/user/v5/read/",
      search_user: "api/user/v3/search",
      create_questionset: "api/questionset/v1/create",
      update_hierarchy: "api/questionset/v1/hierarchy/update",
      publish_questionset: "api/questionset/v1/publish",
      read_questionset: "api/questionset/v1/hierarchy/",
      create_question: "api/question/v1/create",
      publish_question: "api/question/v1/publish",
      create_program: "api/program/v1/create",
      update_program: "api/program/v1/update",
      add_program_nomination: "api/program/v1/nomination/add",
      update_program_nomination: "api/program/v1/nomination/update",
      publish_program: "api/program/v1/publish",
    },
    config: {
      sunbird: {
        query: {
          username: process.env.SUNBIRD_USER,
          password: process.env.SUNBIRD_PWD,
          grant_type: process.env.SUNBIRD_GRANT,
          client_id: process.env.SUNBIRD_CLIENT,
          client_secret: process.env.SUNBIRD_CLIENT_SECRET,
        },
        authorization: process.env.SUNBIRD_AUTHORIZATION,
      },
      vdn: {
        query: {
          username: process.env.SUNBIRD_USER,
          password: process.env.SUNBIRD_PWD,
          grant_type: process.env.SUNBIRD_GRANT,
          client_id: process.env.SUNBIRD_CLIENT,
          client_secret: process.env.SUNBIRD_CLIENT_SECRET,
        },
        authorization: process.env.VDN_AUTHORIZATION,
      },
    },
  },
};

module.exports = {
  CONFIG,
};
