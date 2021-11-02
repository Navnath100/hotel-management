const express = require('express')
const { getBalance , addBalance } = require('../controller/balanceController')

const balanceRouter = express.Router()

// /api/balance
balanceRouter.get('/:id' , getBalance)
balanceRouter.post('/add/:id' , addBalance)

module.exports = { balanceRouter }