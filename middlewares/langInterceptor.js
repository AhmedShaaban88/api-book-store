const langInterceptor = (req,res, next) => {
    let {lang} = req.query;
    if(lang !== "en" && lang !== "ar"){
        req.query.lang = "en"
    }
    next();
}

module.exports = langInterceptor;