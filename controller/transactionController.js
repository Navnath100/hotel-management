const joi=require('joi')
const { User } = require('../models/users')
const { Transaction } = require('../models/transactions')
const { sendEmail } = require('../middlewares/notification');

// /api/resider/
async function getTransactions(req,res,next) {
    try {
        const { date_filter } = req.query
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const search = {};
        if(date_filter == "today"){
            search.createdAt = {
                $gte: new Date().setHours(00, 00, 00),
                $lt: new Date().setHours(23, 59, 59)
            }
        }

        const dt = new Date();
        const day = dt.getDay();
        let n = null; // last Monday conversion

        switch (dt.getDay()) {
            case 0: n = -6; break;
            case 1: n = 0; break;
            case 2: n = -1; break;
            case 3: n = -2; break;
            case 4: n = -3; break;
            case 5: n = -4; break;
            case 6: n = -5; break;
            default: "This never happens";
        }

        const monday = new Date().setDate(new Date().getDate() + n );
        const sunday = new Date().setDate(new Date().getDate() + 6 );

        if(date_filter == "this-week"){
            search.createdAt = {
                $gte: new Date(monday).setHours(00, 00, 00),
                $lt: new Date()
            }
        }

        if(date_filter == "last-week"){
            const lastWeekMonday = new Date().setDate((new Date().getDate() + n)-7 );
            const lastWeeksunday = new Date().setDate(new Date().getDate()+n-1);
            search.createdAt = {
                $gte: new Date(lastWeekMonday).setHours(00, 00, 00),
                $lt: new Date(lastWeeksunday).setHours(23, 59, 59)
            }
        }

        if(date_filter == "this-month"){
            // const year = ff;
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth());
            const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(),daysInMonth);
            search.createdAt = {
                $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
            }
        }

        if(date_filter == "last-month"){
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth()-1);
            const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth()-1,daysInMonth);
            search.createdAt = {
                $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
            }
        }

        if(date_filter == "last-three-months"){
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth()+1;
            const daysInMonth = new Date(year, month, 0).getDate();
            const firstDayOfMonth = new Date(year+"-"+(month-3)+"-"+1);
            const lastDayOfMonth = new Date(year+"-"+month+"-"+currentDate.getDate());
            search.createdAt = {
                $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
            }
        }
        
        if(date_filter == "this-year"){
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const firstDayOfYear = new Date(year+"-"+1+"-"+1);
            const lastDayOfYear = new Date(year+"-"+12+"-"+31);
            search.createdAt = {
                $gte: new Date(firstDayOfYear).setHours(00, 00, 00),
                $lt: new Date(lastDayOfYear).setHours(23, 59, 59)
            }
        }
        
        Transaction.find(search).then(transactions=>{
            if(transactions.length >= 0){
                let todayExpenses = 0;
                for (let i = 0; i < transactions.length; i++)
                    todayExpenses += transactions[i].charges                      
            }
            res.json(transactions);
        });

    } catch (error) {
        return next(new Error(error))
    }
    
}
async function addTransaction(req,res,next) {
    try {
        let schema = joi.object({
            description:joi.string().required(),
            type:joi.string().required(),
            amount:joi.number().required(),
            item:joi.string()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
        
        const transactionData = result.value;
        transactionData.by = req.params.id;
        User.findOne({_id : transactionData.by}).then(user =>{
            if(user && user.status == "Active"){
                new Transaction(transactionData).save().then(transaction=>{
                    res.json(transaction);
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
    
module.exports = { getTransactions, addTransaction }