const {Schema, model} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseLeanGetters = require('mongoose-lean-getters');
const updateVersionKey = require("../utils/updateVersionKey");
const rateSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    rate: {type: Number, min:0 , default: 0, max: 5},
}, {_id: false})
const bookSchema = new Schema({
    name: [
        {language: {type: String, default: 'en', enum: ['ara', 'en']},
         value: {type: String, trim: true, required: true}
        }
    ],
    rating: [{type: rateSchema, select: false}],
    avgRate: {type: Number, default: 0},
    views: {type: Schema.Types.Array, select: false, transform: (views) => views, get: (views) => views.length || 0},
    // downloads: {type: Schema.Types.Array, select: false, transform: (downloads) => downloads.length || 0},
    pages: {type: Number, default: 1, min: 1, required: true, select: false},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    description: {type: [
        {language: {type: String, default: 'en', enum: ['ara', 'en']},
            value: {type: String, trim: true}
        }
    ], select: false},
    price: {type: Number, default: 0},
    cover: String,
    status: {type: Number, enum: [0,1], default: 0}

}, {timestamps: true, toJSON: {getters: true, virtuals: true}, optimisticConcurrency: true});

bookSchema.pre('updateOne', function(next) {
    updateVersionKey(this.getUpdate());
    return next();
});
bookSchema.plugin(mongoosePaginate);
bookSchema.plugin(mongooseLeanGetters);
module.exports = model('Book', bookSchema);