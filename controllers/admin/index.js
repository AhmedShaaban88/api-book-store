const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const User = require('../../models/user');
const translation = require("../../utils/translation");
const {removeFile} = require('../../utils/cloudinary');
const killCurrentWorker = require("../../utils/killWorker");

const deleteUser = asyncHandler(async (req, res, next) => {
    const {id: userId} = req.params;
    const {lang} = req.query;
    const user = await User.findByIdAndDelete(userId, {lean: true, runValidators: true, returnOriginal: true, omitUndefined: true});
    if(!user) return next(catchError.NotFound('User not found'));
    if(user.avatar) await removeFile(user.avatar, 'user-avatar');
    killCurrentWorker();
    return res.status(200).json({message: translation[lang].deleteUser})
});

module.exports = {deleteUser};