const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema

const transactionsSchema = new Schema({
    amount : {type : Number , required:true},
    availableBalance : {type : Number , required:true},
    previousBalance : {type : Number , required:true},
    by : {type : String , required:true}, // Object id of employee
    type : {type : String , required:true}, // debit/credit
    description : {type : String , required:false},
    transactionFor : {type : String , required:false}, // check-out/check-in/staff-expenses/withdrawel etc.
    item : {type : String , required:false}  // for staff expense use only
},
{
    timestamps: true
}
)


const Transaction = mongoose.model('transaction',transactionsSchema)

module.exports = {Transaction}