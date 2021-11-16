const express = require('express')
const { getTransactions, addStaffExpense,withdrawal,todayBusiness } = require('../controller/transactionController')

const transactionRouter = express.Router()

// /api/transaction
transactionRouter.get('/:id' , getTransactions)
transactionRouter.post('/staff-expense/:id' , addStaffExpense)
transactionRouter.post('/withdrawel/:id' , withdrawal)
transactionRouter.get('/today-business/:id' , todayBusiness)

module.exports = { transactionRouter }