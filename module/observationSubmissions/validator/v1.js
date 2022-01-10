module.exports = (req) => {

    let observationSubmissionValidator = {

        isAllowed: function () {
            req.checkParams('_id').exists().withMessage("required observation submission id")
            req.checkQuery('evidenceId').exists().withMessage("required evidenceId")
        },

        makePdf: function () {
            req.checkParams('_id').exists().withMessage("required observation submission id")
        },

        create: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
            req.checkQuery('entityId').exists().withMessage("required entity id")
        },

        title: function () {
            req.checkBody('title').exists().notEmpty().withMessage("required observation submission title")
        },

        pushObservationSubmissionForReporting: function () {
            req.checkParams('_id').exists().withMessage("required submission id")
        },

        list: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
            .isMongoId().withMessage("Invalid observation id");
            req.checkQuery('entityId').exists().withMessage("required entity id")
            .isMongoId().withMessage("Invalid entity id");
        },

        status: function () {
            req.checkParams('_id').exists().withMessage("required submission id")
            .isMongoId().withMessage("Invalid submission id");
        },
        update: function () {
            req.checkParams('_id').exists().withMessage("required observation submission id")
        },
        solutionList: function () {
            req.checkBody('role').exists().withMessage("request body required");
        },
        details: function () {
            req.checkParams('_id').exists().withMessage("required submission id")
            .isMongoId().withMessage("Invalid submission id");
        },
    }

    if (observationSubmissionValidator[req.params.method]) observationSubmissionValidator[req.params.method]();

};