/**
 * name : programUsers.js
 * author : Vishnu
 * created-date : 9-Jan-2023
 * Description : PII data related controller.
*/

/**
     * programUsers
     * @class
 */
module.exports = class ProgramUsers extends Abstract {
    constructor() {
        super(programUsersSchema);
    }

    static get name() {
        return "programUsers";
    }

};
  
  