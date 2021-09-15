function ApiAuthorization(req,res,next) {
    const key_username = "Navnath";
    const key_password = 'password@1234'
    try {
        // console.log("req.headers.authorization",req.headers.authorization);
        if(req.headers.authorization){
            if (req.headers.authorization.split(' ')[0] != "Basic") return next(new Error("Basic Auth Required...!"));
            const base64Credentials =  req.headers.authorization.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [username, password] = credentials.split(':');
            // console.log("Entered by user",username,password);
            if(key_username == username && key_password == password){
                return next();
            }else{
                return next(new Error("API Authorization Fail...!"));
            }
        }else{
            return next(new Error("API Authorization Credentials Required...!"));
        }
    } 
     catch (error) {
        next(error);
    }
}

module.exports = ApiAuthorization;