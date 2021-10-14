const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require("multer");
const path = require("path");

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.cloud_api_key,
    api_secret: process.env.cloud_api_secret,
    secure: true
});
function mediaUploader(folder){
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: folder,
            resource_type: 'image',
            discard_original_filename: true,
        },
    });

    return multer({
        storage: storage,
        limits: {fileSize: 500000},
        fileFilter: function (req, file, cb) {
            let filetypes = /jpeg|jpg|png/;
            let mimetype = filetypes.test(file.mimetype);
            let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) {
                return cb(null, true);
            }
            cb({name: "MulterError", message: "Unsupported image type only jpg, jpeg, png"}, false);
        },
    });

}

const getImagePublicId = (imageURL, folder) => {
    const image = imageURL.split(`${folder}/`)[1].split('.')[0]
    return folder + '/' + image;
}

const removeImage = (imageURL, folder) => {
    const id = getImagePublicId(imageURL, folder);
    return cloudinary.uploader.destroy(id);
}

module.exports = {mediaUploader, removeImage};