const express = require('express')
const { getUsers,createUsers,userLogin } = require('../controller/userController')

const userRouter = express.Router()

// /api/user
userRouter.get('/' , getUsers)
userRouter.post('/' , createUsers)
userRouter.post('/login' , userLogin)

module.exports = { userRouter }