const bcrypt = require("bcryptjs");
const catchError = require("http-errors");
async function encryptPassword(password) {
    const salt =  await bcrypt.genSalt(12);
    if(!salt) return catchError.InternalServerError();
    const hashed =  await bcrypt.hash(password, salt);
    if(!hashed) return catchError.InternalServerError();
    return hashed;

}
async function decryptPassword(password, decryptedPassword) {
    return await bcrypt.compare(password, decryptedPassword);
}

module.exports = {encryptPassword, decryptPassword};