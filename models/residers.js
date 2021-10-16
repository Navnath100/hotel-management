const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema

const residerSchema = new Schema({
    name : {type : String , required:true},
    phone : {type : Number , required:true},
    email : {status: {type :String, default:'Pending'}, emailID:{type : String,required:true},resetToken : {type : String,required:false},expireToken : {type : Date,required:false}},
    idProof : {type: {type :String,required:true}, img:{Bucket:{type:String , required:true},Key:{type:String , required:true}}},
    addressProof : {type: {type :String,required:true}, img:{Bucket:{type:String , required:true},Key:{type:String , required:true}}},
    checkIn : {by: {type :String,required:true}, time:{type : String    ,required:true}},
    checkOut : {by: {type :String,required:false}, time:{type : Date,required:false}},
    bill : {type :Object,required:false},
    status : {type : String , required:true , default:'checked-in'},
    expenses : [{item : {type:String} , charges : {type:Number},addedBy:{type:String}}],
},
{
    timestamps: true
})


const Resider = mongoose.model('resider',residerSchema)

module.exports = {Resider}