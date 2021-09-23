// const admin = require("firebase-admin");
// // const serviceAccount = require("../hawkins-incident-management-firebase-adminsdk-7ym1l-e9a37aeb85.json");
// const fetch = require('node-fetch')

const SgMail = require("@sendgrid/mail");
// const { response } = require("express");
const emailApiKey = "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";
SgMail.setApiKey(emailApiKey)

// // async function sendNotification(title,body,token,next) {
// //     // admin.initializeApp({
// //     //     credential: admin.credential.cert(serviceAccount)
// //     //   });

// //     //   for(let i = 0;i<token.length;i++){
// //     //     const message = {
// //     //         console.log(message);
// //     //             notification:{
// //     //                 title,
// //     //                 body
// //     //             },
// //     //             token:token[i]
// //     //         }
// //     //     admin.messaging().send(message).catch(err=>{
// //     //         next(new Error(err));
// //     //         console.log(err);
// //     //     })
// //     //   }

// //       const notification={
// //         'title':title,
// //         'body':body
// //     };

// //     const notification_body={
// //         'notification':notification,
// //         'registration_ids':token
// //     };

// //       fetch('https://fcm.googleapis.com/fcm/send',{
// //           'method':'POST',
// //           'headers':{
// //               'Authorization':'key='+'AAAA0hU9_Xo:APA91bHFsJkS7WcdmSghMERorveEb4-j-QUo0wGD6pd1MtjdyRxMVmxBqnC8h7-iXnDf9d0NhBsqB0TsQn6Zr58HwNtmWM7CjaLtMZmigBNsnCWiq5bOcfy-38gGB3ytT97IAkHo6vQd',
// //               'Content-Type':'application/json'
// //           },
// //           'body':JSON.stringify(notification_body)
// //       }).then((rr)=>{
// //           console.log(rr);
// //       }).catch(err=>{
// //         console.log(err);
// //       })
// // }

async function sendEmail(subject,body,to) {
    const msg = {
        to,
        from:{
            name:'Sadguru Lodge',
            email:'sadgurulodge.server@gmail.com',
        },
        subject,
        html:`${body}`,
    }
        SgMail.send(msg)
            // .then((ee)=>res.send({succes : "Email verification link has been sent to your registered email"}))
            .catch((err)=>console.log(err))
}

module.exports = { sendEmail}