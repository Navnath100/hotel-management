const mongoose = require('mongoose')

const DB_URL = 'mongodb+srv://Navnath:enter-password@cluster0.hqyaq.mongodb.net/Sadguru-Lodge?retryWrites=true&w=majority'
async function createConnection(params, next) {
    try {
        await mongoose.connect(DB_URL, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }).then(() => console.log('MongoDB Connected!'))

        mongoose.connection.on('error', err => {
            console.log(err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose connection is disconnected!')
        });

        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log(
                    'Mongoose connection is disconnected due to app termination!'
                );
                process.exit(0);
            });
        });
    } catch (error) {
        console.log("Error in database/connection.js:30", error);
    }
}

module.exports = createConnection