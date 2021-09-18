const express = require('express')
const { getResiders,addResider,checkOut } = require('../controller/residerController')

const residerRouter = express.Router()

// /api/resider
residerRouter.get('/' , getResiders)
residerRouter.post('/' , addResider)
residerRouter.post('/check-out' , checkOut)

module.exports = { residerRouter }