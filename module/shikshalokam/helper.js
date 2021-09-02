const Request = require(GENERIC_HELPERS_PATH + '/httpRequest');
const shikshalokamBaseHost = process.env.USER_SERVICE_URL;
const userOrganisationHelper = require(MODULES_BASE_PATH + "/userOrganisations/helper");

module.exports = class ShikshalokamHelper {

    static getUserProfileFetchUrl(keycloakUserId) {
        return new Promise(async (resolve, reject) => {
            try {

                if (shikshalokamBaseHost == "" || messageConstants.endpoints.USER_READ == "") {
                    throw new Error("User Profile read configuration is missing.");
                }
                
                let shikshalokamBaseHostUrl = shikshalokamBaseHost;

                if(!shikshalokamBaseHostUrl.toLowerCase().startsWith("http")) {
                    shikshalokamBaseHostUrl = "https://"+shikshalokamBaseHost
                }

                return resolve(shikshalokamBaseHostUrl + messageConstants.endpoints.USER_READ + "/" + keycloakUserId);

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

};