const catchError = require("http-errors");
const Book = require("../models/book");

const checkAuthorBookAccess = async (bookId, userId) => {
    const book = await Book.findById(bookId).lean();
    if(!book) return Promise.reject(catchError.NotFound('This book not exists'));
    else if(String(book.author) !== String(userId)) return Promise.reject(catchError.Forbidden('You haven\'t access to this book'));
    return Promise.resolve(book);
}

const checkPublishedBook = async (bookId, userId) => {
    const book = await Book.findById(bookId).lean().select('views pages name description price cover file avgRate author status').populate({
        path: 'author',
        select: "email avatar firstName lastName fullName -_id"
    });
    if(!book) return Promise.reject(catchError.NotFound('This book not exists'));
    if(book.status === 0 && !userId) return Promise.reject(catchError.Forbidden('This book haven\'t published yet'));
    else if(book.status === 0 && String(book.author._id) !== String(userId)) return Promise.reject(catchError.Forbidden('You haven\'t access to this book'));

    return  Promise.resolve(book);
}

module.exports = {checkAuthorBookAccess, checkPublishedBook};