module.exports = (req) => {

    let surveysValidator = {

        createSolutionTemplate: function () {
            req.checkBody(Object.keys(req.body)).isEmpty().withMessage("request body is required");
        },

        importSurveryTemplateToSolution: function () {
            req.checkParams('_id').exists().withMessage("required solution id")
            .isMongoId().withMessage("Invalid solution id");
            req.checkQuery('appName').exists().withMessage("required appName");
        },

        mapSurverySolutionToProgram: function () {
            req.checkParams('_id').exists().withMessage("required solution id")
            .isMongoId().withMessage("Invalid solution id");
            req.checkQuery('programId').exists().withMessage("required program id");
        },

        getDetailsByLink: function () {
            req.checkParams('_id').exists().withMessage("required link");
        },

        details: function () {
            req.checkParams('_id').exists().withMessage("required survey id")
            .isMongoId().withMessage("Invalid survey id");
        },
        getSurvey : function () {
            req.checkBody('role').exists().withMessage("required user role");
        },
        getLink: function () {
            req.checkParams('_id').exists().withMessage("required survey solutionId");
            req.checkQuery('appName').exists().withMessage("required app name");
        }
    }

    if (surveysValidator[req.params.method]) surveysValidator[req.params.method]();
};