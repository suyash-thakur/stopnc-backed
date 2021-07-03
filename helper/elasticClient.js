var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  cloud: {
    id: "stopnc-search:dXMtd2VzdDEuZ2NwLmNsb3VkLmVzLmlvJDEwZjAyYzI4Mjc5OTQyZGU5NzFmM2ZkOThkNDBmMDc4JGY1MWU2YjQ0YzkwODRiOTQ4NTJhNjgxNmM5ZTdmYTNj",
  },
  auth: {
    username: "elastic",
    password: "bwD1Bn6S2MIJptBaHsNvBfls",
  },
});

client.ping(
  {
    // ping usually has a 3000ms timeout
    requestTimeout: 2000,
  },
  function (error) {
    if (error) {
      console.trace("elasticsearch cluster is down!");
    } else {
      console.log("All is well");
    }
  }
);
module.exports = client;
