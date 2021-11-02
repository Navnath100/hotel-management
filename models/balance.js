const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema

const balanceSchema = new Schema({
    availableBalance : {type : Number , required:true,default:null},
},
{
    timestamps: true
})


const Balance = mongoose.model('balance',balanceSchema)

module.exports = {Balance}