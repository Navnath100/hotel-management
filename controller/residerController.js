const joi=require('joi')
const { User } = require('../models/users')
const { Resider } = require('../models/residers')
const { StaffExpenses } = require('../models/staffExpenses')
const SendSMS = require('../middlewares/sms')
const { sendEmail,sendCheckOutEmail } = require('../middlewares/notification');
const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const { upload,s3 } = require('../middlewares/uploadImg')
const sendSMS = require('../middlewares/sms')
let residerCount = null;
if (residerCount == null) {
        Resider.find().countDocuments().then(val =>{
            residerCount=val+1;
            console.log("Updated Resider Count");
        }).catch(err =>console.log(err));
}
// /api/resider/
async function getResiders(req,res,next) {
    console.log(i);
    try {
        Resider.find().sort({ createdAt: -1 }).then(async(data)=>{
            const count = await Resider.find().countDocuments();
            if (data) {
                res.json(data)
            }
        });
        //res.json(await Employee.findOne({employeeID : 1}))
    } catch (error) {
        return next(new Error(error))
    }
    
}
// /api/resider/add/:id
async function addResider(req,res,next) {
    let schema = joi.object({
        roomNo:joi.string().pattern(/^[0-9]+$/).required(),
        isAC:joi.boolean().required(),
        amountPerDay:joi.string().pattern(/^[0-9]+$/).required(),
        phone:joi.object({
            number:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
            otp:joi.string().pattern(/^[0-9]+$/),
            expiry:joi.date()
        }).required(),
        // residers:joi.array().items(joi.object({
        //     name:joi.string().min(1).max(60).required(),
        //     email:joi.object({emailID:joi.string().required(),status:joi.string(),resetToken:joi.string(),expireToken:joi.date()}).required(),
        //     idProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required(),
        //     addressProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required()
        // }).required()).min(1).required(),
        // name:joi.string().min(1).max(60).required(),
        // email:joi.object({emailID:joi.string().required(),status:joi.string(),resetToken:joi.string(),expireToken:joi.date()}).required(),
        // idProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required(),
        // addressProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required(),
        // checkIn:joi.object({by:joi.string().required(),time:joi.date()}).required() 
    })
    let result = schema.validate(req.body)
    if(result.error){
        res.status(400);
        return next(new Error(result.error.details[0].message))
    }
    const residerData = result.value;
    // if (residerData.phone.isVerified == false) {
    //     return next(new Error("Please verify your phone no. via OTP"))
    // }
    // residerData["SrNo"] = residerCount,
    User.findOne({_id : req.params.id}).then(user =>{
        if(user){
            const resider = new Resider(residerData).save().then(resider=>{
                // const checkinTime = (new Date(resider.checkIn.time).getTime())+(330*60*1000);
                // const sub = `${resider.name}_ has checked in`;
                // const body = `<h1>Custmer Details</h1>
                //             <p>Name : ${resider.name}<br>
                //             Email : ${resider.email.emailID}<br>
                //             Phone no. : ${resider.phone}<br>
                //             ID Proof : ${resider.idProof.type}<br>
                //             Address Proof : ${resider.addressProof.type}<br>
                //             Checkin Time : ${new Date(checkinTime).toLocaleString()}<br>
                //             Registered By : ${user.name}<br></p>`;
                // const to = "navnathphapale100@gmail.com";
                // sendEmail(sub,body,to);
                // residerCount++;
                const data = {_id:JSON.stringify(resider._id),phone:resider.phone.number,sendRes:false}
                req.body = data;
                req.params = {id:user._id}
                sendOtp(req,res,next)
                res.json(resider);
            });
            
        }else if(!user)
            return next(new Error("Unauthorized access denied"))
    }).catch(err=>{
        return next(new Error(err))
    })

}
// /api/resider/uploadImg
async function uploadImg(req,res,next) {
try {
    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]
    const params = {
        Bucket: "sadguru-lodge",
        Key: `${uuid()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(error)
        }

        res.status(200).send(data)
    })
} catch (error) {
        return next(new Error(error))
    }
}
// /api/resider/check-in:id
async function checkIn(req,res,next){
    try {
        let schema = joi.object({
            // roomNo:joi.string().pattern(/^[0-9]+$/).required(),
            // isAC:joi.boolean().required(),
            // amountPerDay:joi.string().pattern(/^[0-9]+$/).required(),
            // phone:joi.object({
            //     number:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
            //     isVerified:joi.boolean(),
            //     otp:joi.string().pattern(/^[0-9]+$/),
            //     expiry:joi.date()
            // }).required(),
            _id:joi.string().required(),
            phone:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
            residers:joi.array().items(joi.object({
                name:joi.string().min(1).max(60).required(),
                email:joi.object({emailID:joi.string().required(),status:joi.string(),resetToken:joi.string(),expireToken:joi.date()}).required(),
                phone:joi.object({
                    number:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
                    otp:joi.string().pattern(/^[0-9]+$/),
                    expiry:joi.date()
                }).required(),
                idProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required(),
                addressProof:joi.object({type:joi.string().required(),img:joi.object({Bucket:joi.string().required(),Key:joi.string().required()}).required()}).required()
            }).required()).min(1).required(),
            // checkIn:joi.object({by:joi.string().required(),time:joi.date()}).required() 
        })
        let result = schema.validate(req.body)
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
        const residerData = result.value;

        User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                const checkIn={by:req.params.id,time:new Date()}
                Resider.findOne({$and: [{ "phone.number":residerData.phone },{_id:residerData._id} ] }).then(resider1 =>{
                    if(!resider1.phone.isVerified){
                        return next(new Error("Could not process for check in due to unverified phone no."))
                    }else if (resider1.status == "checked-in") {
                        return next(new Error("Already checked in"));
                    }else{
                        Resider.findOneAndUpdate({$and: [{ "phone.number":residerData.phone },{_id:residerData._id} ] }, {$set:{status:"checked-in",residers:residerData.residers,checkIn}}, {new: true}, (err, doc)=>{
                            if(doc){
                                res.json(doc);
                            } else if(err){
                                res.json(err);
                                console.log(err);
                                // return next(new Error(err));
                            }else{
                                return next(new Error("Something went wrong!Either you didn't entered right resider _id or phone no. which is verified"))
                            }
                        }).catch(err=>{
                            return next(new Error(err))
                        });
                    }
                })
            } 
            else
                return next(new Error("Unauthorized access denied"))
        }).catch(err=>{
            return next(new Error(err))
        })

    } catch (error) {
        console.log(error);
        return next(new Error(result.error.details[0].message))
    }
}
// /api/resider/check-out
async function checkOut(req,res,next) {
    let schema = joi.object({
        checkOutBy:joi.string().required(),
        phone:joi.string().length(10).pattern(/^[0-9]+$/).required()
    })
    let result = schema.validate(req.body)

    if(result.error){
        res.status(400);
        return next(new Error(result.error.details[0].message))
    }

    const {checkOutBy,phone} = result.value;
    User.findOne({_id : checkOutBy}).then(user =>{
        if(user && user.status == "Active"){
            Resider.findOne({$and: [{ phone },{status:"checked-in"} ] }).then( (resider)=>{
                if(resider){
                    const perDaycost = 500;
                    let amount = 0;
                    let stayed;
                    // if(new Date().getDate()-new Date(resider.checkIn.time).getDate() == 0){
                    //     amount +=perDaycost;
                    //     stayed = new Date().getHours()-new Date(resider.checkIn.time).getHours() + " Hours"
                    // }
                    // else if(new Date().getDate()-new Date(resider.checkIn.time).getDate() == 1 && new Date().getHours()<11){
                    //     amount +=perDaycost;
                    //     stayed = "1 Day"
                    // }else{
                    //     if(new Date().getHours()>11)
                    //         daysStayed=daysStayed+1
                    //         amount = perDaycost * daysStayed
                    //         stayed = daysStayed;
                    // }

                    
                    if (new Date(resider.checkIn.time).getDate() == new Date().getDate()) {
                        let stay_hours = new Date().getTime() - new Date(resider.checkIn.time).getTime();
                        stayed = stay_hours/(1000*60*60);
                        amount = perDaycost
                    }else {
                        const check_in_time = new Date(resider.checkIn.time).getTime();
                        const first_day_stay = new Date(resider.checkIn.time).setHours(23, 59, 59) - new Date(resider.checkIn.time).getTime();
                        const last_day_stay =  new Date().getTime() - new Date().setHours(00, 00, 00);
                        const check_out_time = new Date().getTime();
                        const steying_time = check_out_time - check_in_time;
                        const mid_time = steying_time-(first_day_stay+last_day_stay);
                        let daysStayed = Math.round(mid_time/(1000*60*60*24)) + 1;  // +1 for first day
                        if (Math.round(last_day_stay/(1000*60*60)) > 11) {
                            stayed = `${daysStayed} and ${last_day_stay/(1000*60*60)} hours`;
                            daysStayed +=1;
                        }
                        amount = daysStayed * perDaycost;
                    }
                        const Bill = {};
                        Bill.Stayed = stayed;
                        Bill.StayCharges = amount;
                        let totalExpenses = 0;
                        for (let i = 0; i < resider.expenses.length; i++) {
                            totalExpenses +=resider.expenses[i].charges;
                        }
                        const total = amount+totalExpenses
                        Bill.Net_Payment_amount = total;
                        Bill.Total_Expenses = totalExpenses;
                        

                        Resider.findOneAndUpdate({ phone  }, {$set:{status:"checked-out",checkOut:{by:checkOutBy,time:new Date().toISOString()}},bill:Bill}, {new: true}, (err, doc)=>{
                            if(doc){
                                res.json(doc);
                                const sub = `${resider.name}_ has checked out`;
                                const body = `<h1>Checked Out Successfully</h1>
                                            <p>Dear ${resider.name}, We are honored that you have chosen to stay with us.Thank you for visiting us at Sadguru Lodge.
                                            Your checkout is confirmed and your total payment amount is Rs.${amount+totalExpenses}. 
                                            Please don’t hesitate to contact us on {9999999999} for any concern.`;
                                const to = ["navnathphapale100@gmail.com",resider.email.emailID];
                                sendCheckOutEmail(sub,body,to);
                                // sendSMS(resider.name,amount+totalExpenses,resider.phone);
                            } else if(err){
                                res.json(err);
                                // return next(new Error(err));
                            }
                        });

                        // res.json(Bill);
                
                }else if(resider == null){
                    return next(new Error("Enter valid phone no."));
                }
            });
        } 
        else
            return next(new Error("Unauthorized access denied"))
    }).catch(err=>{
        return next(new Error(err))
    })
}
// /api/resider/add-expenses
async function addExpense(req,res,next) {
    try {
        let schema = joi.object({
            addedBy:joi.string().required(),
            phone:joi.number().required(),
            item:joi.string().required(),
            charges:joi.number().required()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const {item,charges,addedBy,phone} = result.value;
        User.findOne({_id : addedBy}).then(user =>{
            if(user && user.status == "Active"){
                Resider.findOne({$and: [{ phone },{status:"checked-in"} ] }).then(resider =>{
                    if(resider && resider.status == "checked-in"){
                        Resider.findOneAndUpdate({$and: [{ phone },{status:"checked-in"} ] }, {$push:{expenses:{item,charges,addedBy}}}, {new: false}, (err, doc)=>{
                            if(doc){
                                res.json(doc);
                            } else if(err){
                                res.json(err);
                                console.log(err);
                                // return next(new Error(err));
                            }
                        });
                    }else
                        return next(new Error("Cusromer Not checked in using "+phone));
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
//api/resider//today-business/:id
async function todayBusiness(req,res,next) {
    try {
            User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const client = {}

                Resider.find({createdAt: {$gte: today}}).then(today_business=>{
                    if(today_business.length > 0){
                        let totalAmount = 0;
                        for (let i = 0; i < today_business.length; i++) {
                            if(today_business[i].bill != null)
                                 totalAmount += today_business[i].bill.Net_Payment_amount                       
                        }
                        client["todayBusiness"] = totalAmount;
                        client["todayCustomersCount"] = today_business.length;
                        client["todayCustomers"] = today_business;
                        
                        // res.json(client);
                        StaffExpenses.find({createdAt: {$gte: today}}).then(today_expenses=>{
                            if(today_expenses.length >= 0){
                                let todayExpenses = 0;
                                for (let i = 0; i < today_expenses.length; i++)
                                    todayExpenses += today_expenses[i].charges                      
                                client["todayStaffExpenses"] = todayExpenses;
                            }
                            res.json(client);
                        });

                    }else
                        res.json({error:"Entries not found for today."})
                        
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
//api/resider/send-otp
async function sendOtp(req,res,next) {
    try {
        let schema = joi.object({
            phone:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
            _id:joi.string().required(),
            sendRes:joi.boolean().required()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const {phone,_id , sendRes} = result.value;
        User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                Resider.findOneAndUpdate({_id:JSON.parse(_id),"phone.number":phone  }, {$set:{"phone.otp":123456,"phone.expiry":new Date().getTime()+(1000*60*10)}}, {new: false}, (err, doc)=>{
                    if(doc){
                        const sub = `OTP Verification`;
                        const body = `<h3>Your OTP is 123456.It will expire in 10 minutes</h3>`;
                        const to = "navnathphapale0038@gmail.com";
                        sendEmail(sub,body,to);
                        if(sendRes){
                            res.json({success:"OTP sent successfully"})
                        }                    
                        // sendSMS(resider.name,amount+totalExpenses,resider.phone);
                    } else if(err){
                        console.log("Error while sending otp : "+err);
                    }else{
                        return next(new Error("Something went wrong!Either you have entered wrong resider _id or phone no.",err));
                    }
                }).catch(err=>{
                    return next(new Error(err));
                });
            }else{
                return next(new Error("Unauthorized access denied"));
            }
    }) 
}
catch (error) {
        return next(new Error(error))
    }
}
//api/resider/verify-otp
async function verifyOtp(req,res,next) {
    try {
        let schema = joi.object({
            _id:joi.string().required(),
            otp:joi.number().required(),
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const {_id,otp} = result.value;
        User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                Resider.findOne({ _id }).then(resider =>{
                    if (resider.phone.otp == otp && new Date(resider.phone.expiry).getTime() > new Date().getTime()) {
                        Resider.findOneAndUpdate({ _id  }, {$set:{"phone.otp" : null,"phone.expiry" : null,"phone.isVerified":true}}, {new: true}, (err, doc)=>{
                            if(doc){
                                res.json({success:"OTP verified Successfully"});
                            } else if(err){
                                res.json(err);
                                // return next(new Error(err));
                            }
                        });
                    } else {
                        if (resider.phone.otp != otp) {
                            return next(new Error("Incorrect OTP"))
                        }else if (new Date(resider.phone.expiry).getTime() < new Date().getTime()) {
                            return next(new Error("OTP Expired"));
                        }else{
                            return next(new Error("OTP Verification failed! please try again"));
                        }
                    }
                })
            }else{
                return next(new Error("Unauthorized access denied"));
            }
        })}
        catch (error) {
            return next(new Error(error))
        }
}
//api/residers/edit-phone
async function editPhone(req,res,next) {
    try {
        let schema = joi.object({
            reqBy:joi.string().required(),
            _id:joi.string().required(),
            phone:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const {reqBy,_id,phone} = result.value;
        User.findOne({_id : reqBy}).then(user =>{
            if(user && user.status == "Active"){
                /// send otp and update after verification
            }
        })}
        catch (error) {
            return next(new Error(error))
        }
}

module.exports = { getResiders,addResider,checkIn,checkOut,uploadImg,addExpense,todayBusiness,sendOtp,verifyOtp }