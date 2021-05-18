module.exports = (req) => {

    let filesValidator = {
        getImageUploadUrl: function () {
            req.checkBody('submissionId').exists().withMessage("submission id is required");
            req.checkBody('files').exists().withMessage("files is required");
        }
    }

    if (filesValidator[req.params.method]) filesValidator[req.params.method]();

};