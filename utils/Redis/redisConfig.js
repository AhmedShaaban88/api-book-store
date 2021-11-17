const redis = require('redis')
const client = redis.createClient(process.env.REDIS_PORT);
const catchError = require('http-errors');

client.on("error", function(error) {
    client.quit();
    catchError.InternalServerError();
});
client.on("connect", function() {
    console.error('Connect to Redis successfully');
});
module.exports = client;
