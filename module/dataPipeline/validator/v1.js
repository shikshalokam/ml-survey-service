module.exports = (req) => {

    let dataPipelineValidator = {
        observationSubmission: function () {
            req.checkParams('_id').exists().withMessage("required observation submission id")
            .isMongoId().withMessage("Invalid observation submission id");
        },
        surveySubmission: function () {
            req.checkParams('_id').exists().withMessage("required survey submission id")
            .isMongoId().withMessage("Invalid survey submission id");
        }
    }

    if (dataPipelineValidator[req.params.method]) dataPipelineValidator[req.params.method]();

};