const {removeImage} = require("../utils/cloudinary");
module.exports = function (err, req, res, next) {
    if(req.file){
        removeImage(req.file.path, req.file.filename.split('/')[0]).then(r => next()).catch(e =>res.status(500).json({error: 'Unexpected error with cloudinary'}));
    }
    if(err.name === "ValidationError"){
        return res.status(422).json({error: err.message});
    }
    else if(err.name === "MongoError" && err.code === 11000){
            return res.status(409).json({ error: `${err.keyPattern.email === 1 ? 'Email' : 'Book name'} is already in used` });
    }
    else if(err.code === "LIMIT_FILE_SIZE"){
        return res.status(400).json({error: "File must be less than or equal 0.5 MB"});
    }
    else if(err.name === 'MulterError'){
        return res.status(400).json({error: err.message});
    }
    else if(err.name === 'TokenExpiredError' || err.name === "UnauthorizedError" || err.name === 'JsonWebTokenError'){
        return res.status(401).json({error: err.message});
    }
    else if(res) {
        return res
            .status(err.status || 500)
            .json({error: err.message || "Something wrong happen"});
    }
    throw new Error(err.message)
};