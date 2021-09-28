const express = require('express')
const { getResiders,addResider,checkOut } = require('../controller/residerController')
const { upload,s3 } = require('../middlewares/uploadImg')

const residerRouter = express.Router()

// /api/resider
residerRouter.get('/' , getResiders)
residerRouter.post('/check-in',upload,addResider)
residerRouter.post('/check-out' , checkOut)

module.exports = { residerRouter }