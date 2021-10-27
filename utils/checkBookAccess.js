const catchError = require("http-errors");
const Book = require("../models/book");

const checkAuthorBookAccess = async (bookId, userId) => {
    const book = await Book.findById(bookId).select('name pages description file price cover author views downloads');
    if(!book) return Promise.reject(catchError.NotFound('This book not exists'));
    else if(String(book.author) !== String(userId)) return Promise.reject(catchError.Forbidden('You haven\'t access to this book'));
    return Promise.resolve(book);
}

const checkPublishedBook = async (bookId, userId) => {
    const book = await Book.findById(bookId).lean().select('views pages name description price cover avgRate author status downloads').populate({
        path: 'author',
        select: "-paypalEmail -role -__v"
    });
    if(!book) return Promise.reject(catchError.NotFound('This book not exists'));
    if(book.status === 0 && !userId) return Promise.reject(catchError.Forbidden('This book haven\'t published yet'));
    else if(book.status === 0 && String(book.author._id) !== String(userId)) return Promise.reject(catchError.Forbidden('You haven\'t access to this book'));

    return  Promise.resolve(book);
}

const checkUserPurchaseBook = async (book, userId) => {
    if(!book) return Promise.reject(catchError.NotFound('This book doesn\'t exists'));
    else if(book.status === 0 && String(book.author._id) !== String(userId)) return Promise.reject(catchError.Forbidden('You haven\'t access to this book'));
    else if(book.price <= 0) return Promise.reject(catchError.UnprocessableEntity('The book is free'));
    else if(String(book.author._id) === String(userId)) return Promise.reject(catchError.BadRequest('You shouldn\'t purchase your book!'));
    else if(book.downloads.includes(userId)) return Promise.reject(catchError.BadRequest('You have purchased this book before'));
    return Promise.resolve(true);
}
module.exports = {checkAuthorBookAccess, checkPublishedBook, checkUserPurchaseBook};