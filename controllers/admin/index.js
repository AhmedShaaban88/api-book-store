const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const {spawn} = require('child_process');
const fs = require("fs");
const path = require("path");
const User = require('../../models/user');
const translation = require("../../utils/translation");
const {removeFile} = require('../../utils/cloudinary');

const deleteUser = asyncHandler(async (req, res, next) => {
    const {id: userId} = req.params;
    const {lang} = req.query;
    const user = await User.findByIdAndDelete(userId, {lean: true, runValidators: true, returnOriginal: true, omitUndefined: true});
    if(!user) return next(catchError.NotFound('User not found'));
    if(user.avatar) await removeFile(user.avatar, 'user-avatar');
    return res.status(200).json({message: translation[lang].deleteUser})
});

const backupDatabase = asyncHandler(async (req, res, next) => {
    const backup  = await spawn('mongodump',[`--db=${process.env.DB_NAME}`, `--archive=${process.env.DB_NAME}.gzip`, '--gzip'] );
    backup.stderr.on("data", (data) => console.log('err', data))
    backup.stdout.on("data", data => console.log('data', data))
    backup.on('error', () => process.exit(1));
    backup.on('exit', (code, signal) => {
        if (code === 0 && !signal) return res.status(200).json({message: 'Backup taken successfully'});
        return next(catchError.UnprocessableEntity('Error while taking backup try again later'));
    });
});
const restoreDatabase = asyncHandler(async (req, res, next) => {
    const backupPath = path.join(__dirname, '../../book-store.gzip');
    if(!fs.existsSync(backupPath)) return next(catchError.NotFound('Backup file not exists'));
    const restore  = spawn('mongorestore',[`--nsInclude=${process.env.DB_NAME}.*`, `--archive=${path.join(__dirname, '../../book-store.gzip')}`, '--gzip', '--drop', '--stopOnError'] );
    restore.on('error', (err) => {
        process.exit(1)
    });
    restore.on('exit', (code, signal) => {
        if (code === 0 && !signal) return res.status(200).json({message: 'Restore database successfully'});
        return next(catchError.UnprocessableEntity('Error while restoring try again later'));
    });
});
module.exports = {deleteUser, backupDatabase, restoreDatabase};