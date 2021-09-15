const fast2sms = require('fast-two-sms')
const API_KEY = "AvVw52aXO7JTIlk9MrY0hqtSPGFZ1RbWziK3HQCLmsnDfgdxc873LBmJ9VhSYlRdasorKy4wtb1IpzM6";
async function sendSMS(subject,body,to) {
    var options = {authorization : API_KEY , message : 'Ajun lunch nahi zala ka?' ,  numbers : ['9321843823','8286789757']}
    const response = await fast2sms.sendMessage(options) //Asynchronous Function.
    console.log(response);
}

module.exports = sendSMS