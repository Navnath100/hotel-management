const express = require('express')
const { getResiders,addResider,checkOut,uploadImg,addExpense,todayBusiness,sendOtp,verifyOtp,checkIn,checkedInResiders } = require('../controller/residerController')
const { upload,s3 } = require('../middlewares/uploadImg')

const residerRouter = express.Router()

// /api/resider
residerRouter.get('/' , getResiders)
residerRouter.post('/add/:id',addResider)
residerRouter.put('/check-in/:id',checkIn)
residerRouter.put('/check-out/:id' , checkOut)
residerRouter.post('/upload-doc',upload,uploadImg)
residerRouter.put('/add-expenses/:id',addExpense)
// residerRouter.get('/today-business/:id',todayBusiness)
residerRouter.post('/send-otp/:id',sendOtp)
residerRouter.post('/verify-otp/:id',verifyOtp)
residerRouter.get('/checked-in-residers/:id',checkedInResiders)

module.exports = { residerRouter }