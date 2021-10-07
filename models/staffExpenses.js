const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema

const staffExpensesSchema = new Schema({
    addedBy : {type : String , required:true},
    item : {type : String , required:true},
    charges : {type : Number , required:true},
},
{
    timestamps: true
})


const StaffExpenses = mongoose.model('staffExpens',staffExpensesSchema)

module.exports = {StaffExpenses}