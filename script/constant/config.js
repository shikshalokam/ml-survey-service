require("dotenv").config({path: "./../../.env"});

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
      dev: "https://dev.sunbirded.org/",
      dock: "https://dock.sunbirded.org/",
    },
    APIS: {
      token: "auth/realms/sunbird/protocol/openid-connect/token",
      read_user: "api/user/v5/read/",
      search_user: "api/user/v3/search",
      create_questionset: "api/questionset/v1/create",
      update_hierarchy: "api/questionset/v1/hierarchy/update",
      publish_questionset: "api/questionset/v1/publish",
      create_question: "api/question/v1/create",
      publish_question: "api/question/v1/publish",
      create_program: "api/program/v1/create",
      update_program: "api/program/v1/update",
      add_program_nomination: "api/program/v1/nomination/add",
      update_program_nomination: "api/program/v1/nomination/update",
      publish_program: "api/program/v1/publish",
    },
    config: {
      dev: {
        query: {
          username: process.env.username,
          password: process.env.password,
          grant_type: process.env.grant_type,
          client_id: process.env.client_id,
          client_secret: process.env.client_secret,
        },
        authorization: process.env.DEV_AUTHORIZATION,
      },
      dock: {
        query: {
          username: process.env.username,
          password: process.env.password,
          grant_type: process.env.grant_type,
          client_id: process.env.client_id,
          client_secret: process.env.client_secret,
        },
        nominate_user: process.env.nominate_user,
        authorization: process.env.DOCK_AUTHORIZATION,
      },
    },
  },
};

module.exports = {
  CONFIG,
};
