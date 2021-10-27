const {Schema, model} = require('mongoose');
const catchError = require('http-errors');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const {encryptPassword, decryptPassword} = require('../utils/password');
const updateVersionKey = require("../utils/updateVersionKey");

const userSchema = new Schema({
    email: {type: String, required: true, lowercase: true, trim: true},
    paypalEmail: {type: String, lowercase: true, trim: true, select: false},
    avatar: String,
    role: {type: String, enum: ['user', 'author', 'admin'], default: 'user', lowercase: true},
    firstName: {type: String, minlength: 2,trim: true},
    lastName: {type: String, minlength: 2,trim: true},
    password: {type: String, required: true, minlength: 8, select: false},
    confirmed: { type: Boolean, default: false , select: false},
    verifyCode: {type: Number, select: false},
    verifyCodeExpires: {type: Date, select: false},
    forgetCode: {type: Number, select: false},
    forgetCodeExpires: {type: Date, select: false},
    library: [{type: Schema.Types.ObjectId, ref: "Book", select: false}]
}, {optimisticConcurrency: true, id:false});
userSchema.virtual('fullName').get(function (){
    const {firstName, lastName, email} = this;
    if(firstName && lastName) return firstName + " " + lastName;
    else if(firstName && !lastName)return firstName;
    else if(lastName && !firstName)return lastName
    return email.split('@')[0];
})
userSchema.pre("save", function (next) {
    let user = this;
    if (!user.isModified("password")) return next();
    if (user.password) {
        encryptPassword(user.password)
            .then(hash => {
                user.password = hash;
                next();
            })
            .catch(err => next(err));
    }
});
userSchema.pre('updateOne', function(next) {
    const modifiedField = this.getUpdate().$set.password;
    const user = this;
    if (!modifiedField) {
        updateVersionKey(this.getUpdate());
        return next();
    }else{
        this.model.findOne(this.getQuery(),'password', (err, res) => {
            decryptPassword(modifiedField, res.password).then(compareRes => {
                if(compareRes) next(catchError.Conflict('the new password can\'t be the same as the old password'));
                else {
                    encryptPassword(modifiedField)
                        .then(hash => {
                            user._update.$set.password = hash;
                            updateVersionKey(this.getUpdate());
                            next();
                        })
                        .catch(err => next(err));
                }
            }).catch(err => next(err))

        });
    }
});
userSchema.plugin(mongooseLeanVirtuals);
module.exports = model('User', userSchema);
