const jwt = require('jsonwebtoken');

function generateToken({email, role, _id}) {
    const options = {
        issuer: 'Book Store App',
        audience: process.env.base_url,
        subject: String(_id),
        expiresIn: '10d',
        algorithm: 'RS256'
    };
    return jwt.sign({email, role}, process.env.private_key_token, options);
}

function generateRefreshToken({email, role, _id}) {
    const options = {
        issuer: 'Book Store App',
        audience: process.env.base_url,
        subject: String(_id),
        expiresIn: '30d',
        algorithm: 'RS256'
    };
    return jwt.sign({email, role}, process.env.private_key_refresh_token, options)
}
function verifyRefreshToken(refreshToken) {
    return jwt.verify(refreshToken, process.env.public_key_refresh_token, {});
}
module.exports = {generateToken, generateRefreshToken, verifyRefreshToken};