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
            discard_original_filename: true,
        },
    });

    return multer({
        storage: storage,
        limits: {fileSize: 5000000},
        fileFilter: function (req, file, cb) {
            let imageTypes = /jpeg|jpg|png/;
            let fileTypes = /pdf/;
            const type = file.fieldname === 'file' ? fileTypes : imageTypes;
            let mimetype = type.test(file.mimetype);
            let extname = type.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) {
                return cb(null, true);
            }
            cb({name: "MulterError", message: file.fieldname === 'file' ? "Unsupported book file type only pdf":"Unsupported image type only jpg, jpeg, png"}, false);
        },
    });

}

const getFilePublicId = (fileURL, folder) => {
    const image = fileURL.split(`${folder}/`)[1].split('.')[0]
    return folder + '/' + image;
}

const removeFile = (fileURL, folder) => {
    const id = getFilePublicId(fileURL, folder);
    return cloudinary.uploader.destroy(id);
}
const downloadFile = (fileURL) => {
    const DownloadURLSplits = fileURL.split('upload');
    return DownloadURLSplits[0] + "upload/" + 'fl_attachment' + DownloadURLSplits[1];
}

module.exports = {mediaUploader , removeFile, downloadFile};