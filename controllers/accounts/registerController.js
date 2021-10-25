const User = require("../../models/user");
const asyncHandler = require('express-async-handler');
const sendEmail = require('../../utils/sendEmail');
const translation = require("../../utils/translation");

const register = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {email, role, firstName, lastName, password} = req.body;
    const newUser = new User({
        email: email,
        password: password,
        role: role,
        firstName: firstName,
        lastName: lastName,
        verifyCode: Math.floor(1000000 + Math.random() * 9000000),
        verifyCodeExpires: Date.now() + 1800000,
    });
    if (req.file){
        const {path} = req.file;
        newUser.avatar = path;
    }
    const user = await newUser.save();
    if(user){
        await sendEmail(lang, email,user.fullName, user.verifyCode, translation[lang].verifySubj ,translation[lang].verifyMessage, (err, response) => {
            if(response){
                return res.status(201).json({
                    message: translation[lang].verifyEmail,
                    userId: user._id,
                    email: user.email
                });
            }
                next(err);
        })
    }
})

module.exports = register