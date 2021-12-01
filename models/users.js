const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema

const userSchema = new Schema({
    name : {type : String , required:true},
    phone : {type : Number , required:true},
    email : {status: {type :String, default:'Pending'}, emailID:{type : String,required:true},resetToken : {type : String,required:false},expireToken : {type : Date,required:false}},
    password : {type : String , required:true},
    status : {type : String , required:true , default:'Pending'},
    profilePic : {type : String , default : "NA"},
    isAdmin : {type : Boolean , default : false},
    resetPasswordToken : {type : String},
    expireToken : {type : Date},
    fcmTokens : [{type : String}]
},
{
    timestamps: true
})


const User = mongoose.model('user',userSchema)

module.exports = {User}