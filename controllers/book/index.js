const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const {ObjectId} = require('mongoose').Types;
const Book = require('../../models/book');
const translation = require("../../utils/translation");
const {checkAuthorBookAccess, checkPublishedBook} = require("../../utils/checkBookAccess");
const {removeFile} = require('../../utils/cloudinary');

const createBook = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {id} = req.user;
    const {name, pages, description, price} = req.body;
    const newBook = new Book({
        name: name,
        pages: pages,
        author: id,
        description: description,
        price: price,
    })
    if (req.files){
        const {path} = req.files.file ? req.files.file[0] : {};
        newBook.file = path;
        const {path:coverPath} = req.files.cover ? req.files.cover[0] : {};
        newBook.cover = coverPath;
    }
    const book = await newBook.save();
    if(book) return res.status(201).json({message: translation[lang].createBook});
});
const editBook = asyncHandler(async (req, res, next) => {
    let newBookCover, newBookFile;
    const {lang} = req.query;
    const {id: userId} = req.user;
    const {id: bookId} = req.params;
    const book = await checkAuthorBookAccess(bookId, userId);
    if(!book) return next(book);
    const {name, pages, description, price} = req.body;
    if(!name && !pages && !req.files && !description && !price) return next(catchError.BadRequest('Empty body is not allowed'));
    if (req.files){
        const {path} = req.files.file ? req.files.file[0] : {};
        if(book.file && path) await removeFile(book.file, 'books');
        newBookFile = path;
        const {path:coverPath} = req.files.cover ? req.files.cover[0] : {};
        if(book.cover && coverPath) await removeFile(book.cover, 'books');
        newBookCover = coverPath;
    }
    const updatedBook = await Book.updateOne({_id:ObjectId(bookId)}, {$set: {name: name, description: description, price: price, pages: pages, file: newBookFile ,cover: newBookCover}}, {omitUndefined: true, runValidators: true, lean: true});
    if(updatedBook.nModified > 0){
        return res.status(200).json({message: translation[lang].updateBook})
    }
    return next(catchError.UnprocessableEntity('Error while updating this book'));

});
const deleteBook = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {id: userId} = req.user;
    const {id: bookId} = req.params;
    const book = await checkAuthorBookAccess(bookId, userId);
    if(!book) return next(book);
    if(book.file) await removeFile(book.file, 'books');
    if(book.cover) await removeFile(book.cover, 'books');
    const deletedBook = await Book.deleteOne({_id: bookId}, {runValidators: true, lean: true});
    if(deletedBook.deletedCount > 0){
        return res.status(200).json({message: translation[lang].deleteBook})
    }
    return next(catchError.UnprocessableEntity('Error while deleting this book'));

});
const getBook = asyncHandler(async (req,res,next) => {
    const {id: bookId} = req.params;
    const {id: userId} = req.body;
    if(userId && !ObjectId.isValid(userId)) return next(catchError.BadRequest('User id is not valid'));
    const {hash: deviceId, components:{useragent: {browser: {family: deviceType}}}} = req.fingerprint;
    let bookExists = await checkPublishedBook(bookId, userId);
    if(deviceType.toLowerCase() !== "other"){
        if(!bookExists) return next(catchError.NotFound('This book doesn\'t exists'));
        const userView = bookExists.views.includes(deviceId);
        if(!userView){
            await Book.findByIdAndUpdate(bookId, {$addToSet: {views: deviceId}}, {omitUndefined: true,lean: {getters: false}, new: true});
            bookExists = {...bookExists.toObject(), views:bookExists.views.length + 1};
            return res.status(200).json(bookExists);
        }
    }
    return res.status(200).json({...bookExists, views: bookExists.views.length})
});
const books = asyncHandler(async (req,res,next) => {
    const {id: authorId} = req.params;
    const {page = 1, limit = 10} = req.query;
    const {role, id:userId} = req.user;
    const {sortBy, filter, range, orderBy} = req.body;
    const sortByKey = sortBy.toLowerCase() === "rating" ? "avgRate" : sortBy.toLowerCase();
    let books = await Book.paginate({$and: [{author: authorId}, {status: (role === "admin" || String(authorId) === String(userId)) ? {$exists: true}: 1}, {price: (filter.toLowerCase() === "free" ? 0 : {$gte: range[0], $lt: range[1]})}]},
        {select: 'views name avgRate downloads pages price cover', page, limit, sort: {[sortByKey]: orderBy}, lean: {virtuals: true, getters: true}, populate: {path: 'author', select: 'email firstName lastName avatar fullName -_id'}});
    return res.status(200).json(books)
});
const searchBooks = asyncHandler(async (req,res,next) => {
    const {page = 1, limit = 10, q, lang} = req.query;
    let books = await Book.paginate({$or:[{$text: {$search: q, $language: lang}}, {"name.value": {$regex: q, $options: 'ix'}}]},
        {select: 'views name avgRate pages price cover description', page, limit, lean: {virtuals: true, getters: true}, populate: {path: 'author', select: 'email firstName lastName avatar fullName -_id'}});
    return res.status(200).json(books)
});
module.exports = {createBook, editBook, deleteBook, getBook, books, searchBooks};