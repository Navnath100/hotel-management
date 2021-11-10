const express = require('express')
const { getTransactions, addStaffExpense,withdrawal } = require('../controller/transactionController')

const transactionRouter = express.Router()

// /api/transaction
transactionRouter.get('/' , getTransactions)
transactionRouter.post('/staff-expense/:id' , addStaffExpense)
transactionRouter.post('/withdrawel/:id' , withdrawal)

module.exports = { transactionRouter }