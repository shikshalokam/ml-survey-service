const { Client } = require('@elastic/elasticsearch');

module.exports = {
  async connect() {

    if(process.env.ELASTICSEARCH_COMMUNICATIONS_ON_OFF == "ON") {

      const elasticSearchClient = new Client({
        node: process.env.ELASTICSEARCH_HOST_URL || process.env.DEFAULT_ELASTIC_SEARCH_HOST,
        maxRetries: process.env.ELASTIC_SEARCH_MAX_RETRIES,
        requestTimeout: process.env.ELASTIC_SEARCH_REQUEST_TIMEOUT,
        sniffOnStart: process.env.ELASTIC_SEARCH_SNIFF_ON_START
      });

      try {
        
        const elasticSearchPingResponse = await elasticSearchClient.ping({});

        if(elasticSearchPingResponse.statusCode === 200 && elasticSearchPingResponse.meta.connection.url != "") {
          return elasticSearchClient;
        } else {
          throw new Error("Unable to connect to elastic search cluster!");
        }
      } catch (error) {
        throw new Error("Elasticsearch cluster is down!");
      }

    } else {
      return null
    }

  }
};
