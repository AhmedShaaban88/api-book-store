const asyncHandler = require('express-async-handler');
const catchError = require('http-errors');
const Book = require('../../models/book');
const User = require('../../models/user');
const translation = require("../../utils/translation");
const {downloadFile} = require("../../utils/cloudinary");
const {createPayment, executePayment} = require("../../utils/paypal");
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
    else if(book.price > 0 && String(book.author) !== String(userId) && !book.downloads.includes(userId)) next(catchError.UnprocessableEntity('You must purchase this book'));
    if(!book.downloads.includes(userId)){
        await Book.updateOne({_id: bookId}, {$addToSet: {downloads: userId}});
        await User.findByIdAndUpdate(userId, {$addToSet: {library: bookId}}, {projection: 'library', omitUndefined: true});
    }
    return res.status(200).json(downloadFile(book.file));
});
const purchaseBookByPaypal = asyncHandler(async (req, res, next) => {
    const {lang} = req.query;
    const {id: bookId} = req.params;
    const {id: userId} = req.user;
    const book = await Book.findById(bookId, 'status price author downloads name description', {populate: {path: 'author', select: '_id paypalEmail'}, lean: true});
    if(!book) return next(catchError.NotFound('This book doesn\'t exists'));
    else if(book.status === 0 && String(book.author._id) !== String(userId)) next(catchError.Forbidden('You haven\'t access to this book'));
    else if(book.price <= 0) return next(catchError.UnprocessableEntity('The book is free'));
    else if(String(book.author._id) === String(userId)) return next(catchError.BadRequest('You shouldn\'t purchase your book!'));
    else if(book.downloads.includes(userId)) return next(catchError.BadRequest('You have purchased this book before'));
    const transactionLang = lang === "ar" ? 'ara' : 'en';
    const bookName = book.name.filter(bookName => bookName.language === transactionLang)[0].value;
    const bookDesc = book.description && book.description.filter(bookDesc => bookDesc.language === transactionLang)[0].value;
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal",
        },
        "application_context": {
            "shipping_preference": 'NO_SHIPPING',
            "brand_name": bookName,
            "locale": "en_US"
        },
        "redirect_urls": {
            "return_url": `${process.env.base_url}/api/v1/auth/purchase/paypal/${bookId}/success`,
            "cancel_url": `${process.env.base_url}/api/v1/auth/purchase/paypal/fail`
        },
        "transactions": [{
            "payee":{
                "email": book.author.paypalEmail,
            },
            "item_list": {
                "items": [{
                    "name": bookName,
                    "quantity": '1',
                    "price": Number(book.price),
                    "tax": '0.01',
                    "sku": '00001',
                    "currency": 'USD'
                }]
            },
            "amount": {
                "total": Number(book.price) + 0.01,
                "currency": 'USD',
                "details": {
                    "subtotal": Number(book.price),
                    "tax": '0.01'
                }
            },
            "description": bookDesc
        }]
    };
    createPayment(create_payment_json, (err, payment) => {
        if(err) return next(catchError.BadRequest(err.response.details ? err.response.details : err.response.message));
        else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});
const purchaseBookByPaypalSuccess = asyncHandler(async (req, res,next) => {
    const {PayerID, paymentId} = req.query;
    const {id: bookId} = req.params;
    const {id: userId} = req.user;
    const book = await Book.findById(bookId, 'status file price author downloads', {lean: true});
    if(!book) return next(catchError.NotFound('This book doesn\'t exists'));
    else if(book.status === 0 && String(book.author._id) !== String(userId)) next(catchError.Forbidden('You haven\'t access to this book'));
    else if(book.price <= 0) return next(catchError.UnprocessableEntity('The book is free'));
    else if(book.downloads.includes(userId)) return next(catchError.BadRequest('You have purchased this book before'));
    else if(String(book.author._id) === String(userId)) return next(catchError.BadRequest('You shouldn\'t purchase your book!'));
    const execute_payment_json = {
        "payer_id": PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": book.price + 0.01
            }
        }]
    };
    executePayment(paymentId, execute_payment_json, async (err, payment) => {
        if(err) return next(catchError.BadRequest(err.response.details ? err.response.details : err.response.message));
        else{
            await Book.updateOne({_id: bookId}, {$addToSet: {downloads: userId}});
            await User.findByIdAndUpdate(userId, {$addToSet: {library: bookId}}, {projection: 'library', omitUndefined: true});
            return res.redirect(downloadFile(book.file));
        }
    })

});
const purchaseBookByPaypalFail = asyncHandler(async (req, res,next) => {
    return res.json({message: 'Fail to buy this book try again'});
});

module.exports = {rateBook, publishBook, downloadBook, purchaseBookByPaypal, purchaseBookByPaypalSuccess, purchaseBookByPaypalFail};