const jwt = require('jsonwebtoken');
const catchError = require("http-errors");

module.exports = req => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if(!token) return catchError.Unauthorized();
    jwt.verify(token, process.env.public_key_token, {}, function (err, decoded) {
        if(err) throw err;
        const {email, sub: id, role} = decoded
        req.user = {email, id, role};
        return req.user;
    });
}