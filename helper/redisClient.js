var redis = require('redis'),
  /* Values are hard-coded for this example, it's usually best to bring these in via file or environment variable for production */
  client = redis.createClient({
    port: 11938,               // replace with your port
    host: 'redis-11938.c212.ap-south-1-1.ec2.cloud.redislabs.com',        // replace with your hostanme or IP address
    password: '5TFf4fSSIkVSDKVzQnnagH019cy3fUoL',
  });
  client.on('connect', function() {
    console.log('connected redis');
  });
  module.exports = client;
