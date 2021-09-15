const express = require('express')
const { getUsers , 
    createUsers 
} = require('../controller/userController')

const userRouter = express.Router()

// /api/employees
userRouter.get('/' , getUsers)
userRouter.post('/' , createUsers)

module.exports = { userRouter }