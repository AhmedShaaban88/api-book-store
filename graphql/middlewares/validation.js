const Joi = require('joi');
const { string, any, number, array, alternatives } = Joi.types();
const asyncHandler = require('express-async-handler')
/*
{
        errors: { wrap: {label: false}, language: 'ar'},
        messages: {en: { 'string.email': 'Email not valid'}, ar: {'string.email': 'ولا ولا'}}
    }
 */
const validationErrorOptions = {errors: { wrap: {label: false}}};

const email = string.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required();
const paypalEmail = string.email({ minDomainSegments: 2, tlds: { allow: ['com'] } });
const password = string.pattern(new RegExp(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/)).message('password must be more than 7 characters with at least a number, a letter and a special character').required();
const code = number.integer().greater(999999).less(10000000).required();
const bookLang = string.required().valid('en', 'ara');
const bookLetters = array.items(
    Joi.object({
        language: bookLang,
        value: alternatives.conditional('language', {is: 'ara', then: string.pattern( /^[\u0600-\u06FF\u0750-\u077F 0-9]+$/), otherwise:string.trim().pattern(/^[a-zA-Z 0-9]+$/)}).required()
    })
).unique((val1, val2) => val1.language === val2.language).length(2).required()
const emailSchema = Joi.object({email: email});
const passwordSchema = Joi.object().keys({
    password: password,
    confirmPassword:  any.valid(Joi.ref('password')).required().label('Confirm password')
        .messages({ 'any.only': '{{#label}} does not match password' }),
});
const verifyEmailSchema = Joi.object({email: email, code: code});
const refreshTokenSchema = Joi.object({refreshToken: Joi.string().required().min(256)});
const resetPasswordSchema = passwordSchema.append({email: email, code: code});

const userSchema = passwordSchema.append({
    email: email,
    paypalEmail: paypalEmail,
    avatar: any,
    role: string.lowercase().trim().valid('user', 'author', 'admin'),
    firstName: string.min(2).trim(),
    lastName: string.min(2).trim()
});
const loginSchema = Joi.object({
    email: email,
    password: password
});
const updatePasswordSchema = passwordSchema.append({
    oldPassword: string.required()
});
const updateUserSchema = Joi.object({
    paypalEmail: paypalEmail,
    avatar: any,
    firstName: string.min(2).trim(),
    lastName: string.min(2).trim()
});
const createBookSchema = Joi.object({
    cover: any,
    file: any,
    name: bookLetters,
    description: bookLetters,
    price: number.required(),
    pages: number.integer().min(1).required()
});
const updateBookSchema = Joi.object({
    cover: any,
    file: any,
    name: bookLetters.optional(),
    description: bookLetters.optional(),
    price: number,
    pages: number.integer().min(1)
});
const rateSchema = Joi.object({
    rate: number.integer().min(0).max(5).required()
});
const getBooksSchema = Joi.object({
    sortBy: string.lowercase().trim().valid('rating', 'downloads', 'views'),
    orderBy: number.integer().valid(1,-1),
    filter: string.lowercase().trim().valid('free', 'purchase'),
    range: alternatives.conditional('filter', {is: 'purchase', then: array.items(number.min(0), number.min(0)).unique((val1, val2) => (val2 < val1) || val1 === val2).message('Second item must be grater than the first').length(2), otherwise: null})
})
const schemas = {userSchema,emailSchema,resetPasswordSchema, verifyEmailSchema,
    refreshTokenSchema, loginSchema, updatePasswordSchema, updateUserSchema, createBookSchema, updateBookSchema, rateSchema, getBooksSchema};
const genericValidation = async (schema,args, withImage = false, key='avatar') =>  {
    // if(withImage){
    //     const imageKey = (req.body)[key];
    //     if(imageKey || imageKey === ""){
    //         next({name: "MulterError", message: `Unsupported image type for ${key} only jpg, jpeg, png`})
    //     }
    // }
    return await schemas[schema].validateAsync(args, validationErrorOptions);
};


module.exports = genericValidation