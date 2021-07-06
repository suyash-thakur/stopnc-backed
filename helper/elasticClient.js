const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  cloud: {
    id: 'stopnc-search:dXMtd2VzdDEuZ2NwLmNsb3VkLmVzLmlvJDEwZjAyYzI4Mjc5OTQyZGU5NzFmM2ZkOThkNDBmMDc4JGY1MWU2YjQ0YzkwODRiOTQ4NTJhNjgxNmM5ZTdmYTNj',
  },
  auth: {
    username: 'elastic',
    password: 'bwD1Bn6S2MIJptBaHsNvBfls'
  }

})
client.ping({}, { requestTimeout: 20000 }, (err, response) => {
  if (err) {
    console.log(err);
  }
  if (response) {
    console.log(response);
  }
 })

module.exports = client;
