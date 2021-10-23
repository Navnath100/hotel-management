const express = require('express')
const { getResiders,addResider,checkOut,uploadImg,addExpense,todayBusiness,sendOtp,verifyOtp,checkIn } = require('../controller/residerController')
const { upload,s3 } = require('../middlewares/uploadImg')

const residerRouter = express.Router()

// /api/resider
residerRouter.get('/' , getResiders)
residerRouter.post('/add/:id',addResider)
residerRouter.post('/check-in/:id',checkIn)
residerRouter.post('/check-out' , checkOut)
residerRouter.post('/upload-doc',upload,uploadImg)
residerRouter.put('/add-expenses',addExpense)
residerRouter.get('/today-business/:id',todayBusiness)
residerRouter.post('/send-otp/:id',sendOtp)
residerRouter.post('/verify-otp/:id',verifyOtp)

module.exports = { residerRouter }