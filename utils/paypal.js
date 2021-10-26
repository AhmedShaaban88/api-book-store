const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox',
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

const createPayment = (json, cb) => paypal.payment.create(json, function (error, payment) {
        if (error) {
            cb(error, null);
        } else {
            cb(null, payment);
        }
});
const executePayment = (paymentId, json, cb) => paypal.payment.execute(paymentId, json, {},function (error, payment) {
    if (error) {
        cb(error, null);
    } else {
        cb(null, payment);
    }
});

module.exports = {createPayment, executePayment};