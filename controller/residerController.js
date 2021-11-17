const joi=require('joi')
const { User } = require('../models/users')
const { Resider } = require('../models/residers')
const { StaffExpenses } = require('../models/staffExpenses')
const { Transaction } = require('../models/transactions')
const SendSMS = require('../middlewares/sms')
const { sendEmail,sendCheckOutEmail } = require('../middlewares/notification');
const { addTransaction } = require('../controller/transactionController');
const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const { upload,s3,getFileStream } = require('../middlewares/uploadImg')
const sendSMS = require('../middlewares/sms')

// let residerCount = null;
// if (residerCount == null) {
//         Resider.find().countDocuments().then(val =>{
//             residerCount=val+1;
//             console.log("Updated Resider Count");
//         }).catch(err =>console.log(err));
// }
// /api/resider/
async function getResiders(req,res,next) {
    // try {
    //     Resider.find().sort({ createdAt: -1 }).then(async(data)=>{
    //         const count = await Resider.find().countDocuments();
    //         if (data) {
    //             res.json(data)
    //         }
    //     });
    //     //res.json(await Employee.findOne({employeeID : 1}))
    // } catch (error) {
    //     return next(new Error(error))
    // }

    try {
        // const factoryID = req.params.factoryID;
        const {name,phone,isAC, status, date_filter} = req.query;

        const search = {};
        if(phone && phone != "null"){
            search.$or = [
                // {"residers.phone.number" : {$regex:"^"+phone,$options:"$i"}},
                // {"phone" : {$regex:"^"+phone,$options:"$i"}}
            ]
            var reg = /[0-9]/;
            if(reg.test(phone)){
                let firstPosibility = JSON.parse(phone);
                let lastPosibility = JSON.parse(phone);
                for(let i = 0;i<(10-JSON.parse(phone).toString().length);i++){
                    firstPosibility = firstPosibility+"0";
                    lastPosibility = lastPosibility+"9";
                }
                search.$or.push({"phone.number" : {$gte :JSON.parse(firstPosibility),$lte : JSON.parse(lastPosibility)}});
                search.$or.push({"residers.phone.number" : {$gte :JSON.parse(firstPosibility),$lte : JSON.parse(lastPosibility)}});
            }
        }
        if(name && name != "null") search["residers.name"] = name;
        if(isAC && isAC != "null") search.isAC = isAC;
        if(status && status != "null") search.status=status;

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

        const result = {}
        // result.totalItems = await Resider.find({$and: [{ "factory.factoryID": factoryID },search ]}).countDocuments();
        let page;
        let limit;
        if (req.query.page && req.query.limit) {
            page = JSON.parse(req.query.page);
            limit = JSON.parse(req.query.limit);
        }
        else{
            page = 1;
            limit = result.totalItems;
        }
        const startIndex = (page - 1) * limit
        const endIndex = page * limit
        if (endIndex < await Resider.find(search).countDocuments().exec()) {
            result.next = {
                page: page + 1,
                limit: limit
            }
        }
        if (startIndex > 0) {
            result.previous = {
                page: page - 1,
                limit: limit
            }
        }
        result.residers = await Resider.find(search).limit(limit*1).skip((page-1)*limit).sort({ createdAt: -1 });
        res.json(result);
    } catch (error) {
        next(new Error(error));
    }
    
}
// /api/resider/add/:id
async function addResider(req,res,next) {
    let schema = joi.object({
        roomNo:joi.string().pattern(/^[0-9]+$/).required(),
        isAC:joi.boolean().required(),
        amountPerDay:joi.string().pattern(/^[0-9]+$/).required(),
        advance:joi.number(),
        phone:joi.object({
            number:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required()
        }).required(),
        email:joi.object({
            emailID:joi.string().required()
        }).required(),
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
    User.findOne({_id : req.params.id}).then(async(user) =>{
        if(user && user.status == "Active"){
            if(residerData.advance){
                const transactionData = {
                    amount : residerData.advance,
                    by : req.params.id,
                    type : "credit", // debit/credit
                    description : "Advance for check-in in room no."+residerData.roomNo,
                    transactionFor : "check-in-advance", // check-out/check-in/check-in-advance/staff-expenses/withdrawel etc.
                }
                addTransaction(transactionData).then(transactionResult=>{
                    if(transactionResult){
                        return next(new Error(transactionResult))
                    }
                });
            }
                const resider = new Resider(residerData).save().then(async(resider)=>{
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
                    const data = {
                        _id:JSON.stringify(resider._id),
                        // phone:resider.phone.number,
                        phone:resider.email.emailID,
                        sendRes:false
                    }
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
                Resider.findOne({$and: [{_id:residerData._id} ] }).then(resider1 =>{
                    if(!resider1.phone.isVerified){
                        return next(new Error("Could not process for check in due to unverified phone no."))
                    }else if (resider1.status == "checked-in") {
                        return next(new Error("Already checked in"));
                    }else{
                        const update = {
                            status:"checked-in",
                            residers:residerData.residers,
                            checkIn
                        }
                        if (resider1.advance && resider1.advance <= 0) {
                            const transactionData = {
                                amount : resider1.advance,
                                by : req.params.id,
                                description : `Advance for room no. ${resider1.roomNo}.`,
                                type : "credit"
                            }
                            new Transaction(transactionData).save().then(transaction=>{
                            });
                        }
                        Resider.findOneAndUpdate({_id:residerData._id}, {$set:update}, {new: true}, (err, doc)=>{
                            if(doc){
                                const sub = `Checked in room no.${doc.roomNo}`;
                                const body = `<h1>Checked In Successfully</h1>
                                <p>Dear customer, We are honored that you have chosen to stay with us.Thank you for visiting us at Sadguru Lodge.
                                Your Check In is confirmed and your per day cost will be Rs.${doc.amountPerDay}. 
                                Please don’t hesitate to contact us on {9999999999} for any concern.`;
                                const to = [doc.email.emailID];
                                for (let i = 0; i < doc.residers.length; i++) {
                                    to.push(doc.residers[i].email.emailID);
                                }
                                sendEmail(sub,body,to);
                                res.json(doc);
                            } else if(err){
                                console.log("Error Found !bug inside residerController.js->checkIn() ",err);
                                res.json(err);
                                // return next(new Error(err));
                            }else{
                                console.log("Else block executed !bug inside residerController.js->checkIn()->line 354");
                                return next(new Error("Something went wrong!Either you didn't entered right resider _id or phone no. which is verified"))
                            }
                        }).catch(err=>{
                            console.log("Error caught !bug inside residerController.js->checkIn()->line 354");
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
        console.log("Error caught !bug inside residerController.js->checkIn()->line 371 : ", error);
        return next(new Error(result.error.details[0].message))
    }
}
// /api/resider/check-out
async function checkOut(req,res,next) {
    let schema = joi.object({
        residerID:joi.string().required(),
        // phone:joi.string().length(10).pattern(/^[0-9]+$/).required()
    })
    let result = schema.validate(req.body)

    if(result.error){
        res.status(400);
        return next(new Error(result.error.details[0].message))
    }

    const {residerID,phone} = result.value;
    User.findOne({_id : req.params.id}).then(user =>{
        if(user && user.status == "Active"){
            Resider.findOne({$and: [{ _id:residerID },{status:"checked-in"} ] }).then( (resider)=>{
                if(resider){
                    const perDaycost = resider.amountPerDay;
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
                        // const total = amount+totalExpenses
                        Bill.Net_Payment_amount = JSON.parse(amount)+totalExpenses;
                        Bill.Total_Expenses = totalExpenses;
                        Resider.findOneAndUpdate({ _id:residerID }, {$set:{status:"checked-out",checkOut:{by:req.params.id,time:new Date().toISOString()}},bill:Bill}, {new: true}, (err, doc)=>{
                            if(doc){
                                res.json(doc);
                                const sub = `Guest in room no.${resider.roomNo}_ has checked out`;
                                const body = `<h1>Checked Out Successfully</h1>
                                            <p>Dear ${"Guest"}, We are honored that you have chosen to stay with us.Thank you for visiting us at Sadguru Lodge.
                                            Your checkout is confirmed.<br>
                                            Total Bill amount : ${JSON.parse(amount)+totalExpenses} . <br>
                                            Advance : -${doc.advance ? doc.advance : 0 }. <br>
                                            remaining amount = ${doc.advance ? (JSON.parse(amount)+totalExpenses)-doc.advance : JSON.parse(amount)+totalExpenses}. <br>
                                            Please don’t hesitate to contact us on {9999999999} for any concern.`;
                                const to = [resider.email.emailID];
                                sendCheckOutEmail(sub,body,to);
                                // sendSMS(resider.name,amount+totalExpenses,resider.phone);
                                // const transactionData = {
                                //     amount :doc.advance ? (doc.bill.Net_Payment_amount)-doc.advance : doc.bill.Net_Payment_amount,
                                //     by : req.params.id,
                                //     type : "credit",
                                //     description : `Check-Out payment of room no. ${resider.roomNo}.`
                                // }
                                // new Transaction(transactionData).save().then(transaction=>{
                                // });

                                if(doc.bill){
                                    const transactionData = {
                                        amount : doc.advance ? (doc.bill.Net_Payment_amount)-doc.advance : doc.bill.Net_Payment_amount,
                                        by : req.params.id,
                                        type : "credit", // debit/credit
                                        description : "Check-Out of room No. "+doc.roomNo,
                                        transactionFor : "check-out", // check-out/check-in/check-in-advance/staff-expenses/withdrawel etc.
                                    }
                                    addTransaction(transactionData).then(transactionResult=>{
                                        if(transactionResult){
                                            return next(new Error(transactionResult))
                                        }
                                    });
                                }

                            } else if(err){
                                res.json(err);
                                // return next(new Error(err));
                            }
                        });

                        // res.json(Bill);
                
                }
                // else if(resider == null){
                //     return next(new Error("Enter valid phone no."));
                // }
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
            _id:joi.string().required(),
            item:joi.string().required(),
            charges:joi.number().required()
        })
        let result = schema.validate(req.body)
    
        if(result.error){
            res.status(400);
            return next(new Error(result.error.details[0].message))
        }
    
        const {item,charges,_id} = result.value;
        User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                Resider.findOne({$and: [{ _id },{status:"checked-in"} ] }).then(resider =>{
                    if(resider && resider.status == "checked-in"){
                        Resider.findOneAndUpdate({$and: [{ _id },{status:"checked-in"} ] }, {$push:{expenses:{item,charges,addedBy:req.params.id}}}, {new: false}, (err, doc)=>{
                            if(doc){
                                const transactionData = {
                                    amount : charges,
                                    item: item,
                                    by : req.params.id,
                                    type : "debit", // debit/credit
                                    description : "Guest Expense",
                                    transactionFor : "guest-expense", // check-out/check-in/check-in-advance/staff-expense/withdrawel/guest-expense etc.
                                }
                        
                                addTransaction(transactionData).then(transactionResult=>{
                                    if(transactionResult){
                                        return next(new Error(transactionResult))
                                        console.log(transactionResult);
                                    }else
                                        res.json({Success:"Added Successfully"});
                                });
                                res.json(doc);
                            } else if(err){
                                res.json(err);
                                console.log(err);
                                // return next(new Error(err));
                            }
                        });
                    }else
                        return next(new Error("Oops!!Guest not found"));
                }).catch(err=>{
                    return next(new Error(err))
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
            phone:joi.string().required(),
            // phone:joi.string().min(10).max(10).pattern(/^[0-9]+$/).required(),
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
                const OTP = Math.floor(100000 + Math.random() * 900000)
                Resider.findOneAndUpdate({_id:JSON.parse(_id)}, {$set:{"phone.otp":OTP,"phone.expiry":new Date().getTime()+(1000*60*10)}}, {new: false}, (err, doc)=>{
                    if(doc){
                        const sub = `OTP Verification`;
                        const body = `<h3>Your OTP is ${OTP}.It will expire in 10 minutes</h3>`;
                        const to = [phone];
                        sendEmail(sub,body,to);
                        console.log(sub,body,to);
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
//api/residers/checked-in-residers/:id
async function checkedInResiders(req,res,next) {
    try {
        User.findOne({_id : req.params.id}).then(user =>{
            if(user && user.status == "Active"){
                // Resider.find({$and: [{ "status":"checked-in" } ] }).sort({ createdAt: -1 }).then(residers =>{
                    const {name,phone,isAC, roomNo, date_filter} = req.query;
                    const search = {status:"checked-in"};
                    if(phone && phone != "null"){
                        search.$or = [
                            // {"residers.phone.number" : {$regex:"^"+phone,$options:"$i"}},
                            // {"phone" : {$regex:"^"+phone,$options:"$i"}}
                        ]
                        var reg = /[0-9]/;
                        if(reg.test(phone)){
                            let firstPosibility = JSON.parse(phone);
                            let lastPosibility = JSON.parse(phone);
                            for(let i = 0;i<(10-JSON.parse(phone).toString().length);i++){
                                firstPosibility = firstPosibility+"0";
                                lastPosibility = lastPosibility+"9";
                            }
                            search.$or.push({"phone.number" : {$gte :JSON.parse(firstPosibility),$lte : JSON.parse(lastPosibility)}});
                            search.$or.push({"residers.phone.number" : {$gte :JSON.parse(firstPosibility),$lte : JSON.parse(lastPosibility)}});
                        }
                    }
                    if(name && name != "null") search["residers.name"] = {$regex:"^"+name,$options:"$i"};
                    if(isAC && isAC != "null") search.isAC = isAC;
                    // if(status && status != "null") search.status="checked-in";

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

                    const result = {}
                    Resider.find(search).countDocuments().then(count => {result["total"] = count});
                    // result.totalItems = await Resider.find({$and: [{ "factory.factoryID": factoryID },search ]}).countDocuments();
                    let page;
                    let limit;
                    if (req.query.page && req.query.limit) {
                        page = JSON.parse(req.query.page);
                        limit = JSON.parse(req.query.limit);
                    }else{
                        page = 1;
                        limit = result.total;
                    }
                    const startIndex = (page - 1) * limit;
                    const endIndex = page * limit;
                    if (endIndex < result.total) {
                        result.next = {
                            page: page + 1,
                            limit: limit
                        }
                    }
                    if (startIndex > 0) {
                        result.previous = {
                            page: page - 1,
                            limit: limit
                        }
                    }
                    // Resider.find({$and: [{ "status":"checked-in" } ] }).sort({ createdAt: -1 }).then(residers =>{
                    Resider.find(search).limit(limit*1).skip((page-1)*limit).sort({ createdAt: -1 }).then(residers => {
                        result.residers = residers;
                        res.json(result);
                    }).catch(err => {
                        return next(new Error(err))
                    });
            }
            else if(!user)
                return next(new Error("Unauthorized access denied"))
        }).catch(err => {
            return next(new Error(err))
        });
    } catch (error) {
        return next(new Error(error));
    }
}
// api/residers/get-image
async function getImage(req,res,next) {
    try {
        const key = req.params.key
        const readStream = getFileStream(key)

        readStream.pipe(res)
    } catch (error) {
        return next(new Error(error))
    }
}

module.exports = { getResiders,addResider,checkIn,checkOut,uploadImg,addExpense,sendOtp,verifyOtp,checkedInResiders,getImage }