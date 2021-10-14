const mongoose = require('mongoose')
const catchError = require('http-errors');

mongoose.connect(process.env.db_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    poolSize: 10,
    dbName: 'book-store',
    readConcern: 'majority',
    writeConcern:{
        w: 'majority',
        j: true,
        wtimeout: 5000
    }

}).catch(err => {
    mongoose.connection.close();
    catchError.InternalServerError();
});

mongoose.connection.on('error', err => {
    mongoose.connection.close();
    catchError.InternalServerError();
});
mongoose.connection.on('open', err => {
   console.log('database connected ...')
});