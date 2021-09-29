const joi=require('joi')
const { User } = require('../models/users')
const { Resider } = require('../models/residers')
const { sendEmail } = require('../middlewares/notification');
const AWS = require('aws-sdk')
const uuid = require('uuid/v4')
const { upload,s3 } = require('../middlewares/uploadImg')


// /api/resider/
async function getResiders(req,res,next) {
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
// /api/resider/
async function addResider(req,res,next) {
    console.log(req);
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
//     let myFile = req.file.originalname.split(".");
//     const fileType = myFile[myFile.length - 1]
//     console.log(req.file);
//     const BUCKET = "";

//     })

    // let schema = joi.object({
    //     name:joi.string().min(1).max(60).required(),
    //     phone:joi.string().length(10).pattern(/^[0-9]+$/).required(),
    //     email:joi.object({emailID:joi.string().required(),status:joi.string(),resetToken:joi.string(),expireToken:joi.date()}),
    //     idProof:joi.object({type:joi.string().required(),imgLink:joi.string()}),
    //     addressProof:joi.object({type:joi.string().required(),imgLink:joi.string()}),
    //     checkIn:joi.object({by:joi.string().required(),time:joi.date()})    
    // })
    // let result = schema.validate(req.body)

    // if(result.error){
    //     res.status(400);
    //     return next(new Error(result.error.details[0].message))
    // }
    // const residerData = result.value;
    // User.findOne({_id : residerData.checkIn.by}).then(user =>{
    //     if(user){
    //         residerData.checkIn.time = new Date().toISOString();
    //         const resider = new Resider(residerData).save().then(resider=>{
    //             const checkinTime = new Date(resider.checkIn.time).toLocaleString();
    //             const sub = `${resider.name}_ has checked in`;
    //             console.log(sub);
    //             const body = `<h1>Custmer Details</h1>
    //                         <p>Name : ${resider.name}<br>
    //                         Email : ${resider.email.emailID}<br>
    //                         Phone no. : ${resider.phone}<br>
    //                         ID Proof : ${resider.idProof.type}<br>
    //                         Address Proof : ${resider.addressProof.type}<br>
    //                         Checkin Time : ${checkinTime}<br>
    //                         Registered By : ${user.name}<br></p>`;
    //             const to = "navnathphapale100@gmail.com";
    //             sendEmail(sub,body,to);
    //             res.json(resider);
    //         });
            
    //     }else if(!user)
    //         return next(new Error("Unauthorized access denied"))
    // }).catch(err=>{
    //     return next(new Error(err))
    // })

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
            Resider.findOneAndUpdate({phone}, {$set:{status:"checked-out",checkOut:{by:checkOutBy,time:new Date().toISOString()}}}, {new: false}, (err, doc)=>{
                if(doc){
                    const perDaycost = 500;
                    let amount = 0;
                    let daysStayed = new Date().getDate()-new Date(doc.checkIn.time).getDate()
                    let stayed;
                    if(new Date().getDate()-new Date(doc.checkIn.time).getDate() == 0){
                        amount +=perDaycost;
                        stayed = new Date().getHours()-new Date(doc.checkIn.time).getHours() + " Hours"
                    }
                    else if(new Date().getDate()-new Date(doc.checkIn.time).getDate() == 1 && new Date().getHours()<11){
                        amount +=perDaycost;
                        stayed = "1 Day"
                    }else{
                        if(new Date().getHours()>11)
                            daysStayed=daysStayed+1

                            amount = perDaycost * daysStayed
                    }
                        const Bill = {};
                        Bill.Net_Payment_amount = amount;
                        Bill.Stayed = stayed;

                        res.json(Bill);
                } else if(err){
                    return next(new Error("Something Went Wrong While Updating"));
                }else if(doc == null){
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

module.exports = { getResiders,addResider,checkOut }