module.exports = {
    schema : {
        fields : {
            id : "text",
            addedby : "text",
            addedbyname : "text",
            approvaldate : "text",
            approvedby : "text",
            hashtagid : "text",
            isapproved : "boolean",
            isdeleted : "boolean",
            isrejected : "boolean",
            organisationid : "text",
            orgjoindate : "text",
            orgleftdate : "text",
            position : "text",
            roles : {
                type: "list",
                typeDef: "<varchar>"
            },
            updatedby : "text",
            updateddate : "text",
            userid : "text"
    },
      key : ["id"],
     indexes : ["userid","organisationid"]
    },
   name : "user_org",
   db_type : "cassandra"
}