// const { sendNotification , sendEmail } = require('../middlewares/notification')

const joi=require('joi')
const jwt=require('jsonwebtoken')
const hashPassword = require('password-hash');
const { Collection } = require("mongoose");
const crypto = require('crypto');
const { User } = require('../models/users')
// const SgMail = require("@sendgrid/mail");
// const emailApiKey = "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";
// SgMail.setApiKey(emailApiKey)

// /api/employees/
async function getUsers(req,res,next) {
    try {
        User.find().sort({ createdAt: -1 }).then(async(data)=>{
            const count = await User.find().countDocuments();
            if (data) {
                res.json(data)
            }
        });
        //res.json(await Employee.findOne({employeeID : 1}))
    } catch (error) {
        return next(new Error(error))
    }
    
}
// /api/employees/
async function createUsers(req,res,next) {

    let schema = joi.object({
        name:joi.string().min(1).max(60).required(),
        phone:joi.string().length(10).pattern(/^[0-9]+$/).required(),
        email:joi.object({emailID:joi.string().required(),status:joi.string(),resetToken:joi.string(),expireToken:joi.date()}),
        password:joi.string().min(6).max(18).required(),
        confirmPassword:joi.string().min(6).max(18).required(),
        profilePic:joi.string()
    })
    let result = schema.validate(req.body)

    if(result.error){
        res.status(400);
        return next(new Error(result.error.details[0].message))
    }
    
    const empData = result.value;
    const specialCharacterFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;


    
    // if(empData.password.search(/[0-9]/) == -1){
    //     res.status(400);
    //     return next(new Error("Password must contain atleast 6 characters"))
    // }
    // else if(empData.password.search(/[a-z]/) == -1){
    //     res.status(400);
    //     return next(new Error("Password must contain one lower case character"))
    // }
    // else if(empData.password.search(/[A-Z]/) == -1){
    //     res.status(400);
    //     return next(new Error("Password must contain one upper case character"))
    // }
    // else if(!specialCharacterFormat.test(empData.password)){
    //     res.status(400);
    //     return next(new Error("Password must contain special character"))
    // }
    // else if(empData.password != empData.confirmPassword){
    //     res.status(400);
    //     return next(new Error("Password and confirm password doesn't match"))
    // }

    let empEmailValidation = await User.findOne({email : empData.email});
    if(empEmailValidation){
        res.status(400);
        return next(new Error("Email already registered"))
    }

    let empPhoneValidation = await User.findOne({phone : empData.phone});
    if(empPhoneValidation){
        res.status(400);
        return next(new Error("Phone number already registered"))
    }
    
    empData.password = hashPassword.generate(empData.password)
    try {
        const emp = await new User(empData).save();
        res.json(emp);
    } catch (error) {
        return next(new Error(error))
    }
}

module.exports = { 
    getUsers,
    createUsers
  }