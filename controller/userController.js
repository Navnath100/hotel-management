// const { sendNotification , sendEmail } = require('../middlewares/notification')

const joi=require('joi')
const jwt=require('jsonwebtoken')
const hashPassword = require('password-hash');
const { Collection, isValidObjectId } = require("mongoose");
const crypto = require('crypto');
const { User } = require('../models/users')
const { ObjectId } = require('mongodb')

// /api/users/
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

// /api/users/
async function getUserInfo(req,res,next) {
    try {
        const id = req.params.id;
        User.findOne({_id:ObjectId(id)}).then(data=>{
            if(data)
                res.json(data)
        });
    } catch (error) {
        return next(new Error(error))
    }
}

// /api/user/
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

// /api/user/login
async function userLogin(req,res,next) {
    let schema = joi.object({
        phone:joi.string().length(10).pattern(/^[0-9]+$/).required(),
        password:joi.string().required(),
        fcmToken:joi.string()
    })
    let result = schema.validate(req.body)

    if(result.error){
        res.status(400);
        return next(new Error(result.error.details[0].message));
    }

    const {phone , password , fcmToken} = result.value;
    User.findOne({phone}).then(async(user)=>{ 
       if(user){
        if(user.status == "Disabled"){
            res.status(422);
            return next(new Error("Your account is disabled"));
        }
        //password verification
        const isPasswordMatched = hashPassword.verify(password,user.password)
        if(isPasswordMatched){
            const payload ={
                _id : user._id,
                status : user.status
            }
            const token = jwt.sign(payload,"123456")
            res.json({message:"Login Success",token})
            if(req.body.fcmToken)
           {
               User.findOneAndUpdate({phone}, {$push:{fcmTokens:fcmToken}}, {new: false},async (err, doc) =>{
                if(err)
                    console.log("error: ",err);
            })
        }
        }else{
            res.status(401);
            return next(new Error ("Authentication Failed! Wrong Email Or Password"));
        }
    }else{
        res.status(403);
        return next(new Error ("Phone number is not registered"));
    }
    })
}

module.exports = { getUsers,createUsers,userLogin,getUserInfo }