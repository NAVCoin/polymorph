const mongoose = require('mongoose')

const mongoDB = 'mongodb://127.0.0.1/polymorph'
mongoose.connect(mongoDB)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// Define schema

const Schema = mongoose.Schema

const Transaction = new Schema({
  changelly_order_num: { type: String, required: true },
  polymorph_order_num: { type: String, required: true },
  polymorph_order_pass: { type: String, required: true },
  output_currency: { type: String, required: true },
  output_address: { type: String, required: true },
  changelly_address_one: { type: String, required: true },
  // changelly_address_two: { type: String, required: true },
  nav_address_one: { type: String, required: true },
  // nav_address_two: { type: String, required: true },
  order_status: { type: String, required: true },
  delay: { type: Number, min: 0, max: 604800 }, // 1 week max delay
  created: { type: Date, required: true },
})

// Compile model from schema
let TransactionModel = mongoose.model('Transaction', Transaction) //eslint-disable-line

module.exports = TransactionModel
