module.exports = (req) => {

    let programsValidator = {

        entityList: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
        },
        userEntityList: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
        },
        entityBlocks: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
        },
        userList: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
        },
        blockEntity: function () {
            req.checkQuery('solutionId').exists().withMessage("required solution id")
            req.checkQuery('blockId').exists().withMessage("required block id")
        },
        addSolutions : function () {
            req.checkParams('_id').exists().withMessage("required program id");
            req.checkBody("solutionIds").exists().withMessage("required solutions ids");
        },
        mapObservation : function () {
            req.checkBody("programId").exists().withMessage("required program id");
            req.checkBody("questionsetId").exists().withMessage("required questionset Id");
            req.checkBody("createdFor").exists().withMessage("required createdFor");
        },
        updateMapObservation: function () {
            req.checkParams('_id').exists().withMessage("required solutionId id")
            req.checkBody("name").exists().withMessage("required name");
            req.checkBody("description").optional().withMessage("required description");
            req.checkBody("startDate").optional().withMessage("required startDate");
            req.checkBody("endDate").optional().withMessage("required startDate");
            req.checkBody("status").optional().withMessage("required status");
        },

    }

    if (programsValidator[req.params.method]) programsValidator[req.params.method]();

};