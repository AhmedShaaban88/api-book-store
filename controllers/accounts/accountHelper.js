const User = require("../../models/user");
const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const sendEmail = require('../../utils/sendEmail');
const translation = require("../../utils/translation");
const {generateToken, generateRefreshToken, verifyRefreshToken} = require("../../utils/token");
const resendVerificationEmail = asyncHandler(async (req, res, next)  => {
    const {email} = req.body;
    const {lang} = req.query;
    const user = await User.findOne({email: email}, 'email confirmed firstName lastName').lean({virtuals: true});
    if(!user) return next(catchError.NotFound('This book does not exist'));
    else if(user.confirmed) return next(catchError.BadRequest('This book is already activated'));
    const verifiedInfo = {
        verifyCode: Math.floor(1000000 + Math.random() * 9000000),
        verifyCodeExpires: Date.now() + 1800000
    };
   const newUser = await User.updateOne({email: email}, {$set: {verifyCode: verifiedInfo.verifyCode, verifyCodeExpires: verifiedInfo.verifyCodeExpires}}, {lean: true, runValidators: true})
    if(newUser.nModified > 0){
        await sendEmail(lang, email,user.fullName, verifiedInfo.verifyCode, translation[lang].verifySubj ,translation[lang].verifyMessage, (err, response) => {
            if(response){
                return res.status(200).json({message: translation[lang].resendVerification});
            }
            return next(err);
        })
    }
});
const verifyAccount = asyncHandler(async (req, res, next)  => {
    const {email, code} = req.body;
    const user = await User.findOne({email: email}, 'confirmed verifyCodeExpires verifyCode email firstName lastName avatar').lean({virtuals: true});
    if(!user) return next(catchError.NotFound('This book does not exist'));
    else if(user.confirmed) return next(catchError.BadRequest('This book is already activated'));
    else if(Date.now() < user.verifyCodeExpires && code !== user.verifyCode) return next(catchError.BadRequest('The code is not valid'));
    else if(Date.now() > user.verifyCodeExpires) return next(catchError.BadRequest('the code is expired'));
    const updateUser = await User.updateOne({email: email}, {$set:{confirmed: true}, $unset: {verifyCode: "", verifyCodeExpires: ""}});
    if(updateUser.nModified > 0){
        const token = await generateToken(user);
        const refreshToken = await generateRefreshToken(user);
        if(token && refreshToken){
            return res.status(200).json({
                name: user.fullName,
                email: user.email,
                avatar: user.avatar,
                userId: user._id,
                accessToken: token,
                refreshToken: refreshToken
            });
        }
    }
    return next(catchError.UnprocessableEntity('Error while updating this book'));
});
const generateNewToken = asyncHandler(async (req, res, next)  => {
    const {refreshToken} = req.body;
    const validRefreshToken = verifyRefreshToken(refreshToken);
    if(validRefreshToken){
        const {email, sub: id, role} = validRefreshToken;
        const token = await generateToken({email, role, id});
        return res.status(200).json({accessToken: token});
    }
});
const forgetPassword = asyncHandler(async (req,res,next) => {
    const {email} = req.body;
    const {lang} = req.query;
    const user = await User.findOne({email: email}).lean({virtuals: true});
    if(!user) return next(catchError.NotFound('This book does not exist'));
    const forgetPasswordInfo = {
        forgetCode: Math.floor(1000000 + Math.random() * 9000000),
        forgetCodeExpires: Date.now() + 1800000
    };
    const newUser = await User.updateOne({email: email}, {$set: {forgetCode: forgetPasswordInfo.forgetCode, forgetCodeExpires: forgetPasswordInfo.forgetCodeExpires}}, {lean: true, runValidators: true})
    if(newUser.nModified > 0){
        await sendEmail(lang, email,user.fullName, forgetPasswordInfo.forgetCode, translation[lang].forgetSubj ,translation[lang].forgetMessage, (err, response) => {
            if(response){
                return res.status(200).json({message: translation[lang].forgetResponse});
            }
            return next(err);
        })
    }
})
const resetPassword = asyncHandler(async (req,res,next) => {
    const {email, code, password} = req.body;
    const {lang} = req.query;
    const user = await User.findOne({email: email}, 'email forgetCode forgetCodeExpires').lean();
    if(!user) return next(catchError.NotFound('This book does not exist'));
    else if(!user.forgetCode || !user.forgetCodeExpires) return next(catchError.UnprocessableEntity('you haven\'t require to reset password'))
    else if(Date.now() < user.forgetCodeExpires && code !== user.forgetCode) return next(catchError.BadRequest('The code is not valid'));
    else if(Date.now() > user.forgetCodeExpires) return next(catchError.BadRequest('the code is expired'));
    const updateUser = await User.updateOne({email: email}, {$set: {password: password},$unset: {forgetCode: "", forgetCodeExpires: ""}});
    if(updateUser.nModified > 0){
        return res.status(200).json({message: translation[lang].resetPassword});

    }
    return next(catchError.UnprocessableEntity('Error while updating this book'));
})


module.exports = {resendVerificationEmail, verifyAccount, generateNewToken, forgetPassword, resetPassword}