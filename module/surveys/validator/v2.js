module.exports = (req) => {

    let surveysValidator = {
        
    }

    if (surveysValidator[req.params.method]) {
        surveysValidator[req.params.method]();
    }

    
};