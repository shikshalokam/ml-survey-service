module.exports = (req) => {

    let surveySubmissionsValidator = {

        make: function () {
            req.checkBody("evidence").exists().withMessage("request body is required");
        },
        isAllowed: function () {
            req.checkParams('_id').exists().withMessage("required survey submission id")
            .isMongoId().withMessage("Invalid survey submission id");
            req.checkQuery('evidenceId').exists().withMessage("required evidenceId")
        },
        getStatus: function () {
            req.checkParams('_id').exists().withMessage("required survey submission id")
            .isMongoId().withMessage("Invalid survey submission id");
        }
    }

    if (surveySubmissionsValidator[req.params.method]) surveySubmissionsValidator[req.params.method]();
};