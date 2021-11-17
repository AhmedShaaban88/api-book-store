require('dotenv').config();
require('./utils/initialDB');
require('./utils/Redis/redisConfig');
const express = require('express');
const path = require('path');
const helmet = require("helmet");
const catchError = require('http-errors');
const compression = require('compression');
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./middlewares/errorHandler');
const langInterceptor = require('./middlewares/langInterceptor');
const publicRoutes = require('./routes/public');
const protectedRoutes = require('./routes/protected');
const swaggerDocument = require('./swagger.json');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(compression())
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(langInterceptor);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many accounts created from this IP, please try again after an 15 Minutes"
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(`/api${process.env.api_version}`, limiter, publicRoutes);
app.use(`/api${process.env.api_version}/auth`, protectedRoutes);
app.use(function (req, res, next) {
    next(catchError.NotFound());
});
app.use(errorHandler);
module.exports = app;
