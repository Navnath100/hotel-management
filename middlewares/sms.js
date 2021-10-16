const fast2sms = require('fast-two-sms');
// const fetch = require('node-fetch');
const API_KEY = "q5wB8dyEa9fNrGgezjpDl4nF1OPJ2SKvYbhxWci73CXZVtILHkaEyViHeqv52gohMWAG4UOI6d1nZ8pD";
async function sendSMS(name,amount,to) {
    var options = {
        route : 'v3',
        sender_id : 'TXTIND',
        authorization : API_KEY , 
        message : `Dear ${name}, We are honored that you have chosen to stay with us.Thank you for vising us at Sadguru Lodge.
                    Your checkout is confirmed and your total payment amount is Rs.${amount}. 
                    Please don’t hesitate to contact us on {9999999999} for any concern.` ,  
        numbers : [to],
        language : "english",
        flash : "0"
    }
    console.log(options);
    const response = await fast2sms.sendMessage(options) //Asynchronous Function.
    console.log(response);
    // fetch(`https://www.fast2sms.com/dev/bulkV2?authorization = q5wB8dyEa9fNrGgezjpDl4nF1OPJ2SKvYbhxWci73CXZVtILHkaEyViHeqv52gohMWAG4UOI6d1nZ8pD&route=v3&sender_id=TXTIND&message=${options.message}&language=english&flash=0&numbers=${options.numbers}`,{
    //       'method':'GET',
    //       'headers':{
    //           'Authorization':'key='+'AAAA0hU9_Xo:APA91bHFsJkS7WcdmSghMERorveEb4-j-QUo0wGD6pd1MtjdyRxMVmxBqnC8h7-iXnDf9d0NhBsqB0TsQn6Zr58HwNtmWM7CjaLtMZmigBNsnCWiq5bOcfy-38gGB3ytT97IAkHo6vQd',
    //           'Content-Type':'application/json'
    //       },
    //     //   'body':JSON.stringify(notification_body)
    //   }).then((rr)=>{
    //       console.log(rr);
    //   }).catch(err=>{
    //     console.log(err);
    //   })
}

module.exports = sendSMS