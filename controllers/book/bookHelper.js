const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const Book = require('../../models/book');
const User = require('../../models/user');
const translation = require("../../utils/translation");
const {downloadFile} = require("../../utils/cloudinary");
const rateBook = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {id: userId} = req.user;
    const {id: bookId} = req.params;
    const {rate} = req.body;
    const bookExists = await Book.findById(bookId).lean().select('rating');
    if(!bookExists) return next(catchError.NotFound('This book doesn\'t exists'));
    const rateExists = bookExists.rating.findIndex((user) => String(user.userId) === String(userId));
    if(rateExists < 0){
        const avgBookRate = bookExists.rating.reduce((currentRate,{rate: prevRate}) => currentRate + prevRate, rate) / (bookExists.rating.length + 1);
        await Book.updateOne({_id: bookId}, {$push: {rating: {userId, rate}}, $set: {avgRate: avgBookRate.toFixed(2)}}, {lean: true, new: true});
        return res.status(200).json({message: translation[lang].rateBook});
    }
    return next(catchError.Conflict('This user has rated this book before'));
});
const publishBook = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {id: bookId} = req.params;
    const book = await Book.findById(bookId).lean().select('status');
    if(!book) return next(catchError.NotFound('This book doesn\'t exists'));
    const newBook = await Book.updateOne({_id: bookId}, {status: book.status === 0 ? 1 : 0}, {lean: true, new: true});
    if(newBook.nModified > 0) return res.status(200).json({message: translation[lang].updateBook});
    return next(catchError.UnprocessableEntity('Error while updating this book'));
});
const downloadBook = asyncHandler(async (req, res, next) => {
    const {id: bookId} = req.params;
    const {id: userId} = req.user;
    const book = await Book.findById(bookId).lean().select('status file price author downloads');
    if(!book) return next(catchError.NotFound('This book doesn\'t exists'));
    else if(book.status === 0 && String(book.author) !== String(userId)) next(catchError.Forbidden('You haven\'t access to this book'));
    // todo if price > 0
    if(!book.downloads.includes(userId)){
        await Book.updateOne({_id: bookId}, {$addToSet: {downloads: userId}});
        await User.findByIdAndUpdate(userId, {$addToSet: {library: bookId}}, {projection: 'library', omitUndefined: true});
    }
    return res.status(200).json(downloadFile(book.file));
});

module.exports = {rateBook, publishBook, downloadBook};