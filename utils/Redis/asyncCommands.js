const client = require('./redisConfig');
const { promisify } = require("util");
const getHashAsync = promisify(client.hget).bind(client);
const setHashAsync = promisify(client.hset).bind(client);
const checkExistsHashAsync = promisify(client.hexists).bind(client);

const getCachedData = async (key, field) =>{
    if (await checkExistsHashAsync(key, field) > 0) {
        return JSON.parse(await getHashAsync(key, field));
    }
    return false;
}
const setCacheData = async (key, field, value) => {
        await setHashAsync(key, field, value);
}
module.exports = {getCachedData, setCacheData};
