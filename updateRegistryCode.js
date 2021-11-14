let _ = require("lodash");
let MongoClient = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017";

(async () => {

    let connection = await MongoClient.connect(url, { useNewUrlParser: true });
    let db = connection.db("ml-survey");
    try {
        
        let updatedEntityIds = [];
        let entityDocument = await db.collection('entities').find({
            "registryDetails.code" : {$exists : false},
            "registryDetails.locationId" : {$exists : true}
        }).project({ _id: 1}).toArray();
        
        let chunkOfentityDocument = _.chunk(entityDocument, 10);
        let entityIds;
        let entityDocuments;

        for (let pointerToEntity = 0; pointerToEntity < chunkOfentityDocument.length; pointerToEntity++) {
            
            entityIds = await chunkOfentityDocument[pointerToEntity].map(
                entityDoc => {
                  return entityDoc._id;
                }
            );

            entityDocuments = await db.collection("entities").find({
              _id: { $in: entityIds },
              "registryDetails.code" : {$exists : false}
            }).project({
              "_id": 1,
              "registryDetails.locationId": 1
            }).toArray();

            await Promise.all(
                entityDocuments.map(async eachEntityDocument => {

                    if( eachEntityDocument.registryDetails && eachEntityDocument.registryDetails.locationId ) {

                        let updateEntities = await db.collection('entities').findOneAndUpdate({
                            "_id": eachEntityDocument._id,
                        }, {
                            $set: {
                                "registryDetails.code": eachEntityDocument.registryDetails.locationId
                            }
                        });

                        updatedEntityIds.push(eachEntityDocument._id);
                    }
                    
                })
            )
        }
        
        console.log(updatedEntityIds,"updatedEntityIds")
        console.log("completed")
        connection.close();
    }
    catch (error) {
        console.log(error)
    }
})().catch(err => console.error(err));

