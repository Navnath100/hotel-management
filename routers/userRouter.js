const express = require('express')
const { getUsers, createUsers, userLogin, getUserInfo, changeAccountStatus } = require('../controller/userController')

const userRouter = express.Router()

// /api/user
userRouter.get('/', getUsers)
userRouter.post('/', createUsers)
userRouter.post('/login', userLogin)
userRouter.get('/find/:id', getUserInfo)
userRouter.put('/status/:id', changeAccountStatus)

module.exports = { userRouter }