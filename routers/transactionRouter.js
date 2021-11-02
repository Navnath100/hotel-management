const express = require('express')
const { getTransactions, addTransaction } = require('../controller/transactionController')

const transactionRouter = express.Router()

// /api/transaction
transactionRouter.get('/' , getTransactions)
transactionRouter.post('/add/:id' , addTransaction)

module.exports = { transactionRouter }