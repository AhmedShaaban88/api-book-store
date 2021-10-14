const nodeMailer = require('nodemailer');
const path = require("path");
const ejs = require("ejs");
const { google } = require('googleapis');
const translation = require('./translation');
async function sendEmail(lang,receiver, username, code, subject, emailText,cb){

    const CLIENT_ID = process.env.email_client_id;
    const CLEINT_SECRET = process.env.email_client_secret;
    const REDIRECT_URI = process.env.email_redirect_url;
    const REFRESH_TOKEN = process.env.email_refresh_token;

    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLEINT_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const accessToken = await oAuth2Client.getAccessToken();
    if(!accessToken) cb(accessToken, null);
    const mailer = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'ahmedshaaban3288@gmail.com',
            clientId: CLIENT_ID,
            clientSecret: CLEINT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
        },
    });
    ejs.renderFile(path.join(__dirname, "../public/views/verificationEmail.ejs"),
        {
            user_name: username,
            hello: translation[lang].hello,
            dir: lang === "ar" ? "rtl" : "ltr",
            email_text: emailText,
            code: code,
            sec_msg: translation[lang].secMessage,
        }).then(HTMLEmail => {
        const email = {
            to: receiver,
            from: 'ahmedshaaban3288@gmail.com',
            subject: subject,
            text: '',
            html: HTMLEmail
        };
        mailer.sendMail(email, function (err, res) {
            if (err) {
                cb(err, null)
            }
            cb(null, res)
        });
    }).catch(err => {
        cb(err, null)
    });
}

module.exports = sendEmail;