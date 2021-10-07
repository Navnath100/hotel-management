const express = require('express')
const { getStaffExpenses,addExpense,todayStaffExpenses } = require('../controller/staffExpensesController')

const staffExpensesRouter = express.Router()

// /api/staff-expenses
staffExpensesRouter.get('/' , getStaffExpenses)
staffExpensesRouter.post('/add' , addExpense)
staffExpensesRouter.get('/today-expenses/:id' , todayStaffExpenses)

module.exports = { staffExpensesRouter }