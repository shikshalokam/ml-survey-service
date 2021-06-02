let authenticator = require(ROOT_PATH + "/generics/middleware/authenticator");
let pagination = require(ROOT_PATH + "/generics/middleware/pagination");
let dataRangeFilter = require(ROOT_PATH + "/generics/middleware/dateRangeFilter");
let userPrograms = require(ROOT_PATH + "/generics/middleware/userPrograms");
const fs = require("fs");
const inputValidator = require(ROOT_PATH + "/generics/middleware/validator");

module.exports = function (app) {

  app.use(authenticator);
  app.use(pagination);
  app.use(dataRangeFilter);
  app.use(userPrograms);

  var router = async function (req, res, next) {

    //req.params.controller = (req.params.controller).toLowerCase();
    if(req.params.file) {
      req.params.file += "Controller";
    } else {
      req.params.controller += "Controller";
    }

    if (!req.params.version) next();
    else if (!controllers[req.params.version]) next();
    else if (!controllers[req.params.version][req.params.controller]) next();
    else if (!(
      controllers[req.params.version][req.params.controller][req.params.method] 
      || controllers[req.params.version][req.params.controller][req.params.file][req.params.method]
    )) next();
    else if (req.params.method.startsWith("_")) next();
    else {

      try {

        let validationError = req.validationErrors();

        if (validationError.length) {
          throw { 
            status: httpStatusCode.bad_request.status, 
            message: validationError 
          }
        }

        let result;

        if (req.params.file) {
          result = 
          await controllers[req.params.version][req.params.controller][req.params.file][req.params.method](req);
        } else {
          result = 
          await controllers[req.params.version][req.params.controller][req.params.method](req);
        }

        // var result = await controllers[req.params.version][req.params.controller][req.params.method](req);

        if (result.isResponseAStream == true) {
          // Check if file specified by the filePath exists 
          fs.exists(result.fileNameWithPath, function (exists) {

            if (exists) {

              res.setHeader('Content-disposition', 'attachment; filename=' + result.fileNameWithPath.split('/').pop());
              res.set('Content-Type', 'application/octet-stream');
              fs.createReadStream(result.fileNameWithPath).pipe(res);

            } else {

              throw {
                status: httpStatusCode.internal_server_error.status,
                message: httpStatusCode.internal_server_error.message
              };

            }

          });

        } else {
          res.status(result.status ? result.status : httpStatusCode.ok.status).json({
            message: result.message,
            status: result.status ? result.status : httpStatusCode.ok.status,
            result: result.data,
            result: result.result,
            additionalDetails: result.additionalDetails,
            pagination: result.pagination,
            totalCount: result.totalCount,
            total: result.total,
            count: result.count,
            failed: result.failed
          });
        }
      
        console.log('-------------------Response log starts here-------------------');
        console.log("%j",result);
        console.log('-------------------Response log ends here-------------------');
      }
      catch (error) {
        res.status(error.status ? error.status : httpStatusCode.bad_request.status).json({
          status: error.status ? error.status : httpStatusCode.bad_request.status,
          message: error.message
        });

        if (req.userDetails) {
          customFields = {
            appDetails: req.headers["user-agent"],
            userDetails: req.userDetails.firstName + " - " + req.userDetails.lastName + " - " + req.userDetails.email
          }
        }

        console.log('-------------------Response log starts here-------------------');
        console.log(error);
        console.log('-------------------Response log ends here-------------------');
      };
    }
  };

  app.all("/:version/:controller/:method", inputValidator, router);
  app.all("/:version/:controller/:file/:method", inputValidator, router);

  app.all("/:version/:controller/:method/:_id", inputValidator, router);
  app.all("/:version/:controller/:file/:method/:_id", inputValidator, router);

  app.use((req, res, next) => {
    res.status(httpStatusCode.not_found.status).send(messageConstants.apiResponses.NOT_FOUND);
  });
};

