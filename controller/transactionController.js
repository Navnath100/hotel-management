const joi = require('joi')
const { User } = require('../models/users')
const { Resider } = require('../models/residers')
const { Transaction } = require('../models/transactions')
const { sendEmail } = require('../middlewares/notification');
const hashPassword = require('password-hash');

// /api/resider/
async function getTransactions(req, res, next) {
    try {
        User.findOne({ _id: req.params.id }).then(user => {
            if (user && user.status == "Active") {
                const { date_filter, transactionFor } = req.query
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const search = {};
                if (date_filter == "today") {
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

                const monday = new Date().setDate(new Date().getDate() + n);
                const sunday = new Date().setDate(new Date().getDate() + 6);

                if (date_filter == "this-week") {
                    search.createdAt = {
                        $gte: new Date(monday).setHours(00, 00, 00),
                        $lt: new Date()
                    }
                }

                if (date_filter == "last-week") {
                    const lastWeekMonday = new Date().setDate((new Date().getDate() + n) - 7);
                    const lastWeeksunday = new Date().setDate(new Date().getDate() + n - 1);
                    search.createdAt = {
                        $gte: new Date(lastWeekMonday).setHours(00, 00, 00),
                        $lt: new Date(lastWeeksunday).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "this-month") {
                    // const year = ff;
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth());
                    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), daysInMonth);
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "last-month") {
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
                    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1);
                    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, daysInMonth);
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "last-three-months") {
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const firstDayOfMonth = new Date(year + "-" + (month - 3) + "-" + 1);
                    const lastDayOfMonth = new Date(year + "-" + month + "-" + currentDate.getDate());
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "this-year") {
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const firstDayOfYear = new Date(year + "-" + 1 + "-" + 1);
                    const lastDayOfYear = new Date(year + "-" + 12 + "-" + 31);
                    search.createdAt = {
                        $gte: new Date(firstDayOfYear).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfYear).setHours(23, 59, 59)
                    }
                }

                if (transactionFor && transactionFor != null) {
                    search.transactionFor = transactionFor
                }

                let page;
                let limit;
                let totalDocCount;
                Transaction.find(search).countDocuments().exec().then(count => {
                    totalDocCount = count;
                });
                if (req.query.page && req.query.limit) {
                    page = JSON.parse(req.query.page);
                    limit = JSON.parse(req.query.limit);
                }
                else {
                    page = 1;
                    limit = result.totalItems;
                }
                const startIndex = (page - 1) * limit
                const endIndex = page * limit
                if (endIndex < totalDocCount) {
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

                Transaction.find(search).limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 }).then(transactions => {
                    if (transactions.length >= 0) {
                        let todayExpenses = 0;
                        for (let i = 0; i < transactions.length; i++)
                            todayExpenses += transactions[i].charges
                    }
                    res.json(transactions);
                });

            }
        });
    } catch (error) {
        return next(new Error(error))
    }

}
async function addTransaction(body) {
    try {
        let schema = joi.object({
            amount: joi.number().required(),
            by: joi.string().required(),
            type: joi.string().required(),
            description: joi.string().required(),
            transactionFor: joi.string().required(),
            item: joi.string()
        })
        let result = schema.validate(body)

        if (result.error) {
            return new Error(result.error.details[0].message)
        }

        const transactionData = result.value;
        User.findOne({ _id: transactionData.by }).then(user => {
            if (user && user.status == "Active") {
                Transaction.find().sort({ _id: -1 }).limit(1).then(balance => {
                    if (balance.length === 0) {
                        addFirstTransaction()
                    } else {
                        const availableBalance = balance[0]?.availableBalance ? balance[0].availableBalance : 0;
                        transactionData.previousBalance = availableBalance;
                        transactionData.availableBalance = transactionData.type == "credit" ? availableBalance + transactionData.amount : availableBalance - transactionData.amount;
                        new Transaction(transactionData).save().catch(err => {
                            return new Error(err);
                        });
                    }
                }).catch(err => {
                    return new Error(err);
                })
            }
            else
                return new Error("Unauthorized access denied")
        }).catch(err => {
            return new Error(err)
        })
    } catch (error) {
        return new Error(error)
    }

}
async function addFirstTransaction() {
    try {
        new Transaction({
            amount: 0,
            availableBalance: 0,
            previousBalance: 0,
            by: "Navnath Phapale", // Object id of employee
            type: "credit", // debit/credit
            description: "First Tansaction"
        }).save().then(transaction => {
        }).catch(error => {
            return next(new Error(error))
        });
    } catch (error) {
        return next(new Error(error))
    }

}
// /api/transaction/staff-expenses/add/:id
async function addStaffExpense(req, res, next) {
    try {
        let schema = joi.object({
            amount: joi.number().required(),
            item: joi.string().required()
        })
        let result = schema.validate(req.body)

        if (result.error) {
            return next(new Error(result.error.details[0].message))
        }

        const transactionData = {
            amount: result.value.amount,
            item: result.value.item,
            by: req.params.id,
            type: "debit", // debit/credit
            description: "Staff Expense",
            transactionFor: "staff-expense", // check-out/check-in/check-in-advance/staff-expense/withdrawel etc.
        }

        addTransaction(transactionData).then(transactionResult => {
            if (transactionResult) {
                return next(new Error(transactionResult))
            } else
                res.json({ Success: "Added Successfully" });
        });
    } catch (error) {
        return next(new Error(error))
    }
}
async function withdrawal(req, res, next) {
    try {
        let schema = joi.object({
            phone: joi.string().length(10).pattern(/^[0-9]+$/).required(),
            password: joi.string().required(),
            amount: joi.number().required()
        })
        let result = schema.validate(req.body)

        if (result.error) {
            return next(new Error(result.error.details[0].message))
        }
        const { phone, password, amount } = result.value;
        User.findOne({ _id: req.params.id, phone }).then(user => {
            if (user && user.status == "Disabled") {
                res.status(422);
                return next(new Error("Your account is disabled"));
            }
            if (user && user.status == "Active") {
                //password verification
                const isPasswordMatched = hashPassword.verify(password, user.password)
                if (!isPasswordMatched) {
                    res.status(401);
                    return next(new Error("Authentication Failed!"));
                }

                const transactionData = {
                    amount: amount,
                    by: req.params.id,
                    type: "debit", // debit/credit
                    description: `Withdrew by ${user.name}`,
                    transactionFor: "Withdrew", // check-out/check-in/check-in-advance/staff-expense/Withdrew etc.
                }
                Transaction.find().sort({ _id: -1 }).limit(1).then(balance => {
                    if (balance[0].availableBalance < transactionData.amount) {
                        return next(new Error("Transaction could not be done due to low balance"))
                    } else {
                        addTransaction(transactionData).then(transactionResult => {
                            if (transactionResult) {
                                return next(new Error(transactionResult))
                            } else {
                                res.json({ Success: "Transaction Successful" });
                            }
                        });
                    }
                }).catch(err => {
                    return new Error(err);
                })
            } else
                return next(new Error("Something went wrong...!"))
        });
    } catch (error) {
        return next(new Error(error))
    }
}
//api/resider//today-business/:id
async function todayBusiness(req, res, next) {
    try {
        User.findOne({ _id: req.params.id }).then(async (user) => {
            if (user && user.status == "Active") {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const { date_filter } = req.query;
                const search = {};
                const client = {}


                if (date_filter == "today") {
                    search.createdAt = {
                        $gte: new Date(new Date().setHours(00, 00, 00)),
                        $lt: new Date(new Date().setHours(23, 59, 59))
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

                const monday = new Date().setDate(new Date().getDate() + n);
                const sunday = new Date().setDate(new Date().getDate() + 6);

                if (date_filter == "this-week") {
                    search.createdAt = {
                        $gte: new Date(monday).setHours(00, 00, 00),
                        $lt: new Date()
                    }
                }

                if (date_filter == "last-week") {
                    const lastWeekMonday = new Date().setDate((new Date().getDate() + n) - 7);
                    const lastWeeksunday = new Date().setDate(new Date().getDate() + n - 1);
                    search.createdAt = {
                        $gte: new Date(lastWeekMonday).setHours(00, 00, 00),
                        $lt: new Date(lastWeeksunday).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "this-month") {
                    // const year = ff;
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth());
                    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), daysInMonth);
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "last-month") {
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
                    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1);
                    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, daysInMonth);
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "last-three-months") {
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const firstDayOfMonth = new Date(year + "-" + (month - 3) + "-" + 1);
                    const lastDayOfMonth = new Date(year + "-" + month + "-" + currentDate.getDate());
                    search.createdAt = {
                        $gte: new Date(firstDayOfMonth).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfMonth).setHours(23, 59, 59)
                    }
                }

                if (date_filter == "this-year") {
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const firstDayOfYear = new Date(year + "-" + 1 + "-" + 1);
                    const lastDayOfYear = new Date(year + "-" + 12 + "-" + 31);
                    search.createdAt = {
                        $gte: new Date(firstDayOfYear).setHours(00, 00, 00),
                        $lt: new Date(lastDayOfYear).setHours(23, 59, 59)
                    }
                }
                Resider.aggregate([
                    {
                        $match: {
                            $and: [
                                { $nor: [{ status: "Pending" }] },
                                {
                                    $or: [
                                        // search, // uncomment this to get dynamic result according to date_filter

                                        { createdAt: { $gte: new Date(new Date().setHours(00, 00, 00)), $lt: new Date(new Date().setHours(23, 59, 59)) } }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        $group: {
                            "_id": '$isAC',
                            Advance: { $sum: '$advance' },
                            StayAmount: { $sum: '$amountPerDay' },
                            count: { $sum: 1 }
                        }
                    }
                ]).then(result => {
                    if (result.length == 0) {
                        client["ACRooms"] = 0;
                        client["ACRoomsAmount"] = 0;
                        client["nonACRooms"] = 0;
                        client["nonACRoomsAmount"] = 0;
                    }
                    else if (result.length == 1) {
                        if (result[0]._id == true) {
                            client["ACRooms"] = result[0].count;
                            client["ACRoomsAmount"] = result[0].StayAmount;
                        } else {
                            client["nonACRooms"] = result[0].count;
                            client["nonACRoomsAmount"] = result[0].StayAmount;
                        }
                    }
                    else if (result.length == 2) {
                        if (result[0]._id == true) {
                            client["ACRooms"] = result[0].count;
                            client["ACRoomsAmount"] = result[0].StayAmount;
                        } else {
                            client["nonACRooms"] = result[0].count;
                            client["nonACRoomsAmount"] = result[0].StayAmount;
                        }
                        if (result[1]._id == false) {
                            client["nonACRooms"] = result[1].count;
                            client["nonACRoomsAmount"] = result[1].StayAmount;
                        } else {
                            client["ACRooms"] = result[1].count;
                            client["ACRoomsAmount"] = result[1].StayAmount;
                        }
                    }

                    Transaction.aggregate([
                        {
                            $match: {
                                $and: [
                                    { $nor: [{ status: "Pending" }] },
                                    {
                                        $or: [
                                            // search, // uncomment this to get dynamic result according to date_filter

                                            { createdAt: { $gte: new Date(new Date().setHours(00, 00, 00)), $lt: new Date(new Date().setHours(23, 59, 59)) } }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            $group: {
                                "_id": '$type',
                                Total: { $sum: '$amount' },
                            }
                        }
                    ]).then(transactionsCount => {
                        let debit = 0;
                        let credit = 0;
                        if (transactionsCount.length == 1) {
                            if (transactionsCount[0]._id == "debit") {
                                debit = transactionsCount[0].Total;
                            } else
                                credit = transactionsCount[0].Total;
                        }
                        else if (transactionsCount.length == 2) {
                            if (transactionsCount[0]._id == "debit") {
                                debit = transactionsCount[0].Total;
                            } else {
                                credit = transactionsCount[0].Total;
                            }
                            if (transactionsCount[1]._id == "debit") {
                                debit = transactionsCount[1].Total;
                            } else {
                                credit = transactionsCount[1].Total;
                            }
                        } else {
                            debit = 0;
                            credit = 0;
                        }
                        client["TodayBusiness"] = credit - debit;

                        Transaction.aggregate([
                            {
                                $match: {
                                    $and: [
                                        { transactionFor: "staff-expense" },
                                        {
                                            $or: [
                                                // search, // uncomment this to get dynamic result according to date_filter
                                                { createdAt: { $gte: new Date(new Date().setHours(00, 00, 00)), $lt: new Date(new Date().setHours(23, 59, 59)) } }
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                $group: {
                                    "_id": '$transactionFor',
                                    Total: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]).then(staffExpenses => {
                            if (staffExpenses.length != 0) {
                                client["staffExpenses"] = staffExpenses[0].Total;
                                client["staffExpensesCount"] = staffExpenses[0].count;
                            } else {
                                client["staffExpenses"] = 0;
                                client["staffExpensesCount"] = 0;
                            }
                            res.json(client);
                        })
                    })
                })

            } else
                return next(new Error("Unauthorized access denied"))
        }).catch(err => {
            return next(new Error(err))
        })

    } catch (error) {
        return next(new Error(error))
    }
}

module.exports = { addFirstTransaction, addTransaction, getTransactions, addStaffExpense, addStaffExpense, withdrawal, todayBusiness }