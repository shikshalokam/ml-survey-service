/**
 * name : redis.js.
 * author : Jayesh Savaliya.
 * created-date : 09-Aug-2024.
 * Description : Redis health check.
*/
const redis = require("redis");

function health_check() {
    return new Promise( async (resolve,reject) => {

        const db = redis.createClient(process.env.REDIS_URL);


        db.on("error", function () {
            return resolve(false)
        });

        db.once("open", function() {
            console.log("Redis connection open")
            db.close(function(){});
            return resolve(true);
        });
    })
}

module.exports = {
    health_check : health_check
}