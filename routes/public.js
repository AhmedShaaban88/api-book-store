const express = require('express');
const publicRoutes = express.Router();
const Fingerprint = require('express-fingerprint')
const {mediaUploader} = require("../utils/cloudinary");
const genericValidation = require("../middlewares/validation");
const register = require("../controllers/accounts/registerController");
const {resendVerificationEmail, verifyAccount, generateNewToken, forgetPassword, resetPassword} = require("../controllers/accounts/accountHelper");
const login = require("../controllers/accounts/loginController");
const {checkIdParam} = require("../middlewares/checkUser");
const {getBook} = require("../controllers/book");

publicRoutes.post("/sign-up",mediaUploader('user-avatar').single('avatar'), genericValidation('userSchema', true) ,register);
publicRoutes.post("/resend-verification-email", genericValidation('emailSchema'), resendVerificationEmail);
publicRoutes.post("/verify-account", genericValidation('verifyEmailSchema'), verifyAccount);
publicRoutes.post("/new-access-token",genericValidation('refreshTokenSchema'), generateNewToken);
publicRoutes.post("/forget-password",genericValidation('emailSchema'), forgetPassword);
publicRoutes.post("/reset-password", genericValidation('resetPasswordSchema'),resetPassword);
publicRoutes.post("/login", genericValidation('loginSchema'), login);

//without any auth
publicRoutes.post("/book/:id", checkIdParam('bookId'), Fingerprint(), getBook)


module.exports = publicRoutes;
