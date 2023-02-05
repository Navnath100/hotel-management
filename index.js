const express = require('express')
const compression = require('compression')
//creating connection to database
require('./database/connection')()
const morgan = require('morgan')
const handleErrors = require('./middlewares/error-handler')
const ApiAuthorization = require('./middlewares/apiAuthorization')
const { userRouter } = require('./routers/userRouter')
const { residerRouter } = require('./routers/residerRouter')
const { staffExpensesRouter } = require('./routers/staffExpensesRouter')
const { transactionRouter } = require('./routers/transactionRouter')
const { balanceRouter } = require('./routers/balanceRouter')
const { addFirstTransaction } = require('./controller/transactionController')
// const { ticketRouter } = require('./router/ticketRouter')
// const { locationRouter } = require('./router/locationRouter')
// const { machineRouter } = require('./router/machineRouter')
// const { factoryRouter } = require('./router/factoryRouter')
// const { ticketCommentRouter } = require('./router/ticketCommentRouter')
// const { taskRouter } = require('./router/taskRouter')
// const { scheduleRouter } = require('./router/scheduleRouter')
// const { taskCommentRouter } = require('./router/taskCommentRouter')
// const { imageRouter } = require('./router/imageRouter')

const application = express()

application.use(compression({
    level: 9,
    threshold: 10 * 1000,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false
        }
        return compression.filter(req, res)
    }
}))
application.use(express.json())
application.use(morgan('dev'))

// cors setting
application.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, PATCH, POST, DELETE, GET')
        return res.status(200).json({})
    }

    next()
})

const port = process.env.PORT || 5000
const { Transaction } = require('./models/transactions')


// logic to get latest balance
// Transaction.find().sort({_id:-1}).limit(1).then(doc => {
//     console.log(doc[0]);
// })

//logic to get staff epenses transactions from transactions db
// Transaction.find({item : {$regex:"^",$options:"$i"}}).then(docs => {
//     console.log(docs);
// })
application.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`)
})
// addFirstTransaction();
// application.use(ApiAuthorization)
const APIRouter = express.Router()
application.use('/api', APIRouter)
APIRouter.get('/', (req, res, next) => { res.json("Api is working...!") })
APIRouter.use('/user', userRouter)
APIRouter.use('/resider', residerRouter)
APIRouter.use('/staff-expenses', staffExpensesRouter)
APIRouter.use('/transaction', transactionRouter)
APIRouter.use('/balance', balanceRouter)

// APIRouter.use('/tickets', ticketRouter)

// APIRouter.use('/locations', locationRouter)

// APIRouter.use('/machines', machineRouter)

// APIRouter.use('/factories', factoryRouter)

// APIRouter.use('/ticketComments', ticketCommentRouter)

// APIRouter.use('/tasks', taskRouter)

// APIRouter.use('/schedules', scheduleRouter)

// APIRouter.use('/taskComments', taskCommentRouter)

// APIRouter.use('/images', imageRouter)

application.use(handleErrors)