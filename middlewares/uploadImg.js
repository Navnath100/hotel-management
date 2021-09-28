const multer = require('multer');
const AWS = require('aws-sdk');
const region = "Asia Pacific (Mumbai) ap-south-1"
const AWS_ID = "";
const AWS_SECRET = "";
const AWS_BUCKET_NAME = "sadguru-lodge";
const uuid = require('uuid')

const s3 = new AWS.S3({
    accessKeyId: "AKIAXL4U36XMSJLN72J7",
    secretAccessKey: "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"
})

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

module.exports = { upload,s3 }