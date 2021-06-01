let server = require("../app");
let chai = require("chai");
let chaiHttp = require("chai-http");

// Assertion 
chai.should();
chai.use(chaiHttp); 

describe('Solutions APIs', () => {
    it("Test 400 error for solution details api", (done) => {
        done();
    });
})