const express = require('express')
const { getResiders,addResider,checkOut,uploadImg,addExpense,todayBusiness } = require('../controller/residerController')
const { upload,s3 } = require('../middlewares/uploadImg')

const residerRouter = express.Router()

// /api/resider
residerRouter.get('/' , getResiders)
residerRouter.post('/check-in',addResider)
residerRouter.post('/check-out' , checkOut)
residerRouter.post('/upload-doc',upload,uploadImg)
residerRouter.put('/add-expenses',addExpense)
residerRouter.get('/today-business/:id',todayBusiness)

module.exports = { residerRouter }