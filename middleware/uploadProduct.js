const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const path = require('path');
const mime = require('mime-types')
   dotenv.config();

   aws.config.update({
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'ap-south-1'
   });

   const s3 = new aws.S3();

   async function uploadFilter(req, file, cb){
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === ' image/webp') {
      cb(null, true);
     } else {
      cb(new Error('Wrong file type, only upload JPEG and/or PNG !'),
      false);
     }

};
const uploadProduct = multer({
    fileFilter: uploadFilter,
    storage: multerS3({
    acl: 'public-read',
    s3,
       bucket: 'stopnc',
       onError : function(err, next) {
        console.log('error', err);
         res.json({error: 'error uploading'});
       },
      key: function (req, file, cb) {
        req.file = Date.now() + file.originalname;
      cb(null, 'profilepicture/' +  Date.now() + file.originalname);
     }
    })
   });

   module.exports = uploadProduct;
