const express = require('express');
const protectedRoutes = express.Router();
const authorizedUser = require("../middlewares/authorizedUser");
const {checkRole, checkIdParam} = require("../middlewares/checkUser");
const genericValidation = require("../middlewares/validation");
const {mediaUploader} = require("../utils/cloudinary");
const {editProfile, updatePassword, viewProfile} = require("../controllers/profile");
const {createBook, editBook, deleteBook, books, searchBooks} = require("../controllers/book");
const {rateBook, publishBook} = require("../controllers/book/bookHelper");
const {deleteUser} = require("../controllers/admin");
// profile routes
protectedRoutes.put("/profile/edit", authorizedUser,mediaUploader('user-avatar').single('avatar'),genericValidation('updateUserSchema', true), editProfile);
protectedRoutes.put("/profile/update-password", authorizedUser,genericValidation('updatePasswordSchema'), updatePassword);
protectedRoutes.get("/profile/:id", authorizedUser, checkIdParam('userId') ,viewProfile);

// book routes
protectedRoutes.post("/book/create", authorizedUser,checkRole('author'),mediaUploader('book-cover').single('cover'), genericValidation('createBookSchema', true, 'cover') ,createBook);
protectedRoutes.put("/book/edit/:id", authorizedUser, checkRole('author'),checkIdParam('bookId'),
    mediaUploader('book-cover').single('cover'), genericValidation('updateBookSchema', true, 'cover') ,editBook);
protectedRoutes.delete("/book/:id", authorizedUser, checkRole('author'), checkIdParam('bookId'), deleteBook);

// admin routes
protectedRoutes.delete("/admin/del-user/:id", authorizedUser, checkRole('admin'), checkIdParam('userId'), deleteUser);
protectedRoutes.put("/admin/toggle-publish/:id", authorizedUser, checkRole("admin"), checkIdParam("bookId"), publishBook);

//any user
protectedRoutes.put("/rate/:id", authorizedUser, checkRole('user') ,checkIdParam('bookId'),genericValidation('rateSchema'), rateBook)
protectedRoutes.get("/books/:id", authorizedUser, checkIdParam("authorId"),genericValidation('getBooksSchema'), books)
protectedRoutes.get("/search-books", authorizedUser, searchBooks)
module.exports = protectedRoutes;
