function handleErrors(error,req,res,next) {
    try {
        if(res.statusCode == 200) res.status(500);
        res.json({error:error.message});
    } catch (error) {
        next();
    }
}

module.exports = handleErrors;