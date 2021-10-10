const fast2sms = require('fast-two-sms')
const API_KEY = "q5wB8dyEa9fNrGgezjpDl4nF1OPJ2SKvYbhxWci73CXZVtILHkaEyViHeqv52gohMWAG4UOI6d1nZ8pD";
async function sendSMS(name,amount,to) {
    var options = {
        authorization : API_KEY , 
        message : `Dear ${name} your total payment amount is Rs.${amount} only. Please don’t hesitate to contact us on 9999999999 for any concern.` ,  
        numbers : [to]
    }
    const response = await fast2sms.sendMessage(options) //Asynchronous Function.
    console.log(response);
}

module.exports = sendSMS