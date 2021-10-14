const jwt = require('jsonwebtoken');
const catchError = require("http-errors");

module.exports = (req,res,next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if(!token) return next(catchError.Unauthorized());
    jwt.verify(token, process.env.public_key_token, {}, function (err, decoded) {
        if(err) next(err);
        else{
            const {email, sub: id, role} = decoded
            req.user = {email, id, role};
        }
        next()
    });
}