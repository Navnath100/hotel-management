const joi=require('joi')
const { User } = require('../models/users')
const { Transaction } = require('../models/transactions')
const { Balance } = require('../models/balance')
const { sendEmail } = require('../middlewares/notification');

// /api/balance/
async function getBalance(req,res,next) {
    try {
        Balance.findOne().then(transactions=>{
            if(transactions.length == 1){               
                res.json(transactions);
            }
        });

    } catch (error) {
        return next(new Error(error))
    }
    
}
async function addBalance(req,res,next) {
    try {
        new Balance({availableBalance:0}).save().then(balance=>{
            res.json(balance);
        });

    } catch (error) {
        return next(new Error(error))
    }
    
}
    
module.exports = { getBalance, addBalance }