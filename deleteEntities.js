let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey");
    try {
        
        let entityDocument = await db.collection('entities').find({
            "registryDetails.code" : {$exists : false},
            "registryDetails.locationId" : {$exists : false}
        }).project({ _id: 1}).toArray();
        
        let chunkOfentityDocument = _.chunk(entityDocument, 10);
        let entityIds;

        for (let pointerToEntity = 0; pointerToEntity < chunkOfentityDocument.length; pointerToEntity++) {
            
            entityIds = await chunkOfentityDocument[pointerToEntity].map(
                entityDoc => {
                  return entityDoc._id;
                }
            );

            await db.collection("entities").deleteMany({
              _id: { $in: entityIds }
            });

        }

        console.log("completed")
        connection.close();
    }
    catch (error) {
        console.log(error)
    }
})().catch(err => console.error(err));

