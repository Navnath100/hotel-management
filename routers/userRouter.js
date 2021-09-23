const express = require('express')
const { getUsers,createUsers,userLogin,getUserInfo } = require('../controller/userController')

const userRouter = express.Router()

// /api/user
userRouter.get('/' , getUsers)
userRouter.post('/' , createUsers)
userRouter.post('/login' , userLogin)
userRouter.get('/find/:id' , getUserInfo)

module.exports = { userRouter }