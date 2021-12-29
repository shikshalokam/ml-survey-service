module.exports = (req) => {

    let observationsValidator = {

        add: function () {
            req.checkParams('_id').exists().withMessage("required solution id")
            req.checkBody('data').exists().withMessage("required data")
        },
        metaForm: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        },
        addEntityToObservation: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        },
        removeEntityFromObservation: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        },
        create: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
            req.checkBody('data').exists().withMessage("required data")
        },
        search: function () {
            req.checkQuery('search').exists().withMessage("required search text")
        },
        assessment: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
            req.checkQuery('entityId').exists().withMessage("required entity id")
        },
        complete: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        },
        update: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        },
        completedObservations : function () {
            req.checkQuery('fromDate').exists().withMessage("required from date");
        },
        verifyLink : function () {
            req.checkParams('_id').exists().withMessage("required link")
        },
        submissionStatus : function () {
            req.checkParams('_id').exists().withMessage("required observation id");
            req.checkQuery('entityId').exists().withMessage("required entity id");
        },
        updateEntities: function () {
            req.checkParams('_id').exists().withMessage("required observation id")
        }
    }

    if (observationsValidator[req.params.method]) observationsValidator[req.params.method]();

};