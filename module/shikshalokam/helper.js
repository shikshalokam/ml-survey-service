const Request = require(GENERIC_HELPERS_PATH + '/httpRequest');
const userProfileFetchEndpoint = (process.env.SHIKSHALOKAM_USER_PROFILE_FETCH_ENDPOINT && process.env.SHIKSHALOKAM_USER_PROFILE_FETCH_ENDPOINT != "") ? process.env.SHIKSHALOKAM_USER_PROFILE_FETCH_ENDPOINT : "/api/user/v1/read";
const shikshalokamBaseHost = (process.env.SHIKSHALOKAM_BASE_HOST && process.env.SHIKSHALOKAM_BASE_HOST != "") ? process.env.SHIKSHALOKAM_BASE_HOST : ""
const shikshalokamHelper = require( ROOT_PATH + "/generics/services/shikshalokam");

module.exports = class ShikshalokamHelper {

    // <- Dirty fix . Old code currently not in used.

    // static getUserOrganisation(authToken = "", keycloakUserId = "") {
    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             if (authToken == "" || keycloakUserId == "") {
    //                 throw new Error(messageConstants.apiResponses.REQUIRED_AUTH_TOKEN_OR_USER_ID);
    //             }
                
    //             let userOrganisationDetails = await userOrganisationHelper.list([keycloakUserId])

    //             if(userOrganisationDetails.success && 
    //                 userOrganisationDetails.data && 
    //                 userOrganisationDetails.data[keycloakUserId] && 
    //                 userOrganisationDetails.data[keycloakUserId].organisations && 
    //                 userOrganisationDetails.data[keycloakUserId].organisations.length > 0) {

    //                 return resolve({
    //                     success : true,
    //                     message : "User organisations fetched successfully.",
    //                     data : {
    //                         organisations : userOrganisationDetails.data[keycloakUserId].organisations,
    //                         rootOrganisations : userOrganisationDetails.data[keycloakUserId].rootOrganisations
    //                     }
    //                 });
                    
    //             } else {
    //                 throw new Error("User organisation details not found.");
    //             }

    //             // let userDetails = await this.getUserDetails(authToken, keycloakUserId);

    //             // if(userDetails.success && userDetails.data && userDetails.data.organisations && userDetails.data.organisations.length > 0 && userDetails.data.rootOrg.rootOrgId != "") {
    //             //     let rootOrganisations = [userDetails.data.rootOrg.rootOrgId];
    //             //     let organisations = _.union(rootOrganisations,_.map(userDetails.data.organisations, 'id'));
    //             //     return resolve({
    //             //         success : true,
    //             //         message : "User organisations fetched successfully.",
    //             //         data : {
    //             //             organisations : organisations,
    //             //             rootOrganisations : rootOrganisations
    //             //         }
    //             //     });
    //             // } else {
    //             //     throw new Error("User organisation details not found.");
    //             // }

    //         } catch (error) {
    //             return reject({
    //                 success : false,
    //                 message : error.message
    //             });
    //         }
    //     })
    // }

    static getUserOrganisation( authToken,keycloakUserId ) {
        return new Promise(async (resolve, reject) => {
            try {

                let organisationData = 
                await shikshalokamHelper.userProfile(
                    authToken,
                    keycloakUserId
                );

                return resolve(organisationData);

            } catch (error) {
                return reject({
                    success : false,
                    message : error.message
                });
            }
        })
    }

    static getUserProfileFetchUrl(keycloakUserId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (shikshalokamBaseHost == "" || userProfileFetchEndpoint == "") {
                    throw new Error("User Profile read configuration is missing.");
                }
                
                let shikshalokamBaseHostUrl = shikshalokamBaseHost;

                if(!shikshalokamBaseHostUrl.toLowerCase().startsWith("http")) {
                    shikshalokamBaseHostUrl = "https://"+shikshalokamBaseHost
                }

                return resolve(shikshalokamBaseHostUrl + userProfileFetchEndpoint + "/" + keycloakUserId);

            } catch (error) {
                return reject({
                    success : false,
                    message : error.message
                });
            }
        })
    }

    static getUserDetails(authToken = "", keycloakUserId = "") {
        return new Promise(async (resolve, reject) => {
            try {

                if (authToken == "" || keycloakUserId == "") {
                    throw new Error(messageConstants.apiResponses.REQUIRED_AUTH_TOKEN_OR_USER_ID);
                }

                const reqObj = new Request();

                const requestURL = await this.getUserProfileFetchUrl(keycloakUserId);

                let requestheaders = {
                    "content-type": "application/json",
                    "Authorization": process.env.AUTHORIZATION,
                    "X-authenticated-user-token": authToken
                }

                let userProfileResponse = await reqObj.get(
                    requestURL,
                    {
                        headers: requestheaders
                    }
                )
                
                if(userProfileResponse.status == 200) {
                    let response = JSON.parse(userProfileResponse.data);
                    if(response.responseCode === "OK" && response.result.response.id != "") {
                        return resolve({
                            success : true,
                            message : "User profile fetched successfully",
                            data : response.result.response
                        });
                    } else {
                        throw new Error("Failed to get user profile");
                    }
                } else {
                    throw new Error("Failed to get user profile");
                }

            } catch (error) {
                return reject({
                    success : false,
                    message : error.message
                })
            }
        })
    }

     /**
     * Organisation and root organisation data
     * @method
     * @name getOrganisationsAndRootOrganisations
     * @param {String} token - token data.
     * @param {String} userId - Logged in user id.
     * @returns {Array} - Created for and root organisation details.
     */

    // static getOrganisationsAndRootOrganisations(token,userId) {
    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             let userOrganisations = 
    //             await this.getUserOrganisation(token, userId);

    //             let createdFor = new Array;
    //             let rootOrganisations = new Array;

    //             if(userOrganisations.success && userOrganisations.data) {
    //                 createdFor = userOrganisations.data.organisations;
    //                 rootOrganisations = userOrganisations.data.rootOrganisations;
    //             } else {
    //                 throw new Error(messageConstants.apiResponses.USER_ORGANISATION_DETAILS_NOT_FOUND);
    //             }

    //             return resolve({
    //                 createdFor : createdFor,
    //                 rootOrganisations : rootOrganisations
    //             })

    //         } catch(error) {
    //             return reject(error);
    //         }
    //     })
    // }

     /**
     * Organisation and root organisation data
     * @method
     * @name getOrganisationsAndRootOrganisations
     * @param {String} token - token data.
     * @param {String} userId - Logged in user id.
     * @returns {Array} - Created for and root organisation details.
     */

    static getOrganisationsAndRootOrganisations(token,userId) {
        return new Promise(async (resolve, reject) => {
            try {

                let userOrganisations = 
                await this.getUserOrganisation(token, userId);

                let createdFor = new Array;
                let rootOrganisations = new Array;

                if(userOrganisations.success && userOrganisations.data) {
                    
                    createdFor = 
                    userOrganisations.data.organisations.map(
                        organisation => {
                            return organisation.organisationId
                        }
                    );
                    rootOrganisations = [userOrganisations.data.rootOrgId];
                }

                return resolve({
                    createdFor : createdFor,
                    rootOrganisations : rootOrganisations
                })

            } catch(error) {
                return reject(error);
            }
        })
    }

};