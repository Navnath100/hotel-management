const joi=require('joi')
const { User } = require('../models/users')
const { StaffExpenses } = require('../models/staffExpenses')
const { sendEmail } = require('../middlewares/notification');

// /api/resider/
async function getStaffExpenses(req,res,next) {
    try {
        StaffExpenses.find().sort({ createdAt: -1 }).then((data)=>{
            if (data) {
                res.json({data,count:data.length})
            }
        });
    } catch (error) {
        return next(new Error(error))
    }
    
}

// /api/resider/add-expenses
async function addExpense(req,res,next) {
    try {
        let schema = joi.object({
            addedBy:joi.string().required(),
            item:joi.string().required(),
            charges:joi.number().required()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const expenses = result.value;
        User.findOne({_id : expenses.addedBy}).then(user =>{
            if(user && user.status == "Active"){
                const resider = new StaffExpenses(expenses).save().then(exp=>{
                res.json(exp);
                });
            }
            else
                return next(new Error("Unauthorized access denied"))
        }).catch(err=>{
            return next(new Error(err))
        })
    
    } catch (error) {
        console.log(error);
        return next(new Error(error))
    }
}

// /api/resider/add-expenses
async function todayStaffExpenses(req,res,next) {
    try {
            User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                StaffExpenses.find({createdAt: {$gte: today}}).then(today_expenses=>{
                    if(today_expenses.length >0){
                        let totalAmount = 0;
                        for (let i = 0; i < today_expenses.length; i++) {
                                 totalAmount += today_expenses[i].charges                       
                        }
                        res.json({totalAmount,today_expenses});
                    }
                });
            }
            else
                return next(new Error("Unauthorized access denied"))
        }).catch(err=>{
            return next(new Error(err))
        })
    
    } catch (error) {
        console.log(error);
        return next(new Error(error))
    }
}
    
module.exports = { getStaffExpenses,addExpense,todayStaffExpenses }