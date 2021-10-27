const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const User = require("../../models/user");
const {decryptPassword} = require('../../utils/password');
const translation = require("../../utils/translation");
const {removeFile} = require('../../utils/cloudinary');

const editProfile = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {firstName, lastName, paypalEmail} = req.body;
    let newAvatar;
    if(!firstName && !lastName && !req.file && !paypalEmail) return next(catchError.BadRequest('Empty body is not allowed'));
    const {id} = req.user;
    const user = await User.findById(id).lean();
    if(user.firstName === firstName || user.lastName === lastName) return next(catchError.Conflict('You have entered the same name'));
    if (req.file){
        if(user.avatar) await removeFile(user.avatar, 'user-avatar')
        const {path} = req.file;
        newAvatar = path;
    }
    const updatedUser = await User.updateOne({_id:id}, {$set: {firstName: firstName, lastName: lastName, avatar: newAvatar, paypalEmail: paypalEmail}}, {omitUndefined: true, runValidators: true, lean: true});
    if(updatedUser.nModified > 0){
        return res.status(200).json({message: translation[lang].updateProfile})
    }
    return next(catchError.UnprocessableEntity('Error while updating this user'));
});
const updatePassword = asyncHandler(async (req, res, next) => {
    const {password, oldPassword} = req.body;
    const {id} = req.user;
    const {lang} = req.query;
    if(password === oldPassword) return next(catchError.BadRequest('The new password can\'t be the old password'));
    const user = await User.findById(id,'password').lean();
    if(!user) return next(catchError.NotFound('This book does not exist'));
    const authenticated = await decryptPassword(oldPassword, user.password);
    if(!authenticated) return next(catchError.BadRequest('The old password you have entered is incorrect'));
    const updateUser = await User.updateOne({_id: id}, {$set: {password: password}});
    if(updateUser.nModified > 0){
        return res.status(200).json({message: translation[lang].updatePassword})
    }
    return next(catchError.UnprocessableEntity('Error while updating this book'));
});
const viewProfile = asyncHandler(async (req, res, next) => {
    const {id} = req.params;
    const user = await User.findById(id).lean({virtuals: true}).select("-__v -_id");
    if(!user) return next(catchError.NotFound('This user does not exist'));
    return res.status(200).json(user)
});
const userLibrary = asyncHandler(async (req,res,next) => {
    const {id}  = req.user;
    const {skip, limit} = req.query;
    let currentSkip = parseInt(skip);
    let currentLimit = parseInt(limit);
    if(limit < 1 || !Boolean(currentLimit)) currentLimit =1;
    if(skip < 0 || !Boolean(currentSkip)) currentSkip =0;
    let userBooks = await User.findById(id, 'library', {lean: {getters: true},populate: {path: 'library', select: 'views name pages price cover', options:{perDocumentLimit: currentLimit, skip: currentSkip}}});
    return res.status(200).json(userBooks)
});

module.exports = {editProfile, updatePassword, viewProfile, userLibrary}