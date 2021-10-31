const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const User = require("../../models/user");
const {decryptPassword} = require('../../utils/password');
const {generateToken, generateRefreshToken} = require('../../utils/token');
const {logInfo} = require("../../utils/logger");

const login = asyncHandler(async (req, res, next) => {
    const {email, password} = req.body
    const user = await User.findOne({email: email}, 'confirmed firstName lastName email password role').lean({virtuals: true});
    if(!user) return next(catchError.NotFound('This book does not exist'));
    else if(!user.confirmed) return next(catchError.BadRequest('Please activate your account first'));
    const authenticated = await decryptPassword(password, user.password);
    if(!authenticated) return next(catchError.BadRequest('The password you have entered is incorrect'));
    const token = await generateToken(user);
    const refreshToken = await generateRefreshToken(user);
    if(token && refreshToken){
        const {email, avatar, _id, firstName, lastName, fullName} = user;
        await logInfo(req.path, req.method, 'login', {email: email});
        return res.status(200).json({
            fullName: fullName,
            email: email,
            avatar: avatar,
            userId: _id,
            firstName: firstName,
            lastName: lastName,
            accessToken: token,
            refreshToken: refreshToken
        });
    }
})


module.exports = login;