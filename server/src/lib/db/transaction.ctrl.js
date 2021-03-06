"use strict";

const lodash = require('lodash')
let ErrorHandler = require('../error-handler') // eslint-disable-line prefer-const

// Compile model from schema
let TransactionModel = require('./transaction.model')

const TransactionCtrl = { }

TransactionCtrl.createTransaction = (req, res) => {
  return new Promise((fulfill, reject) => {
    const required = ['from', 'to', 'address', 'amount', 'polymorphId',
      'polymorphPass', 'changellyAddressOne', 'changellyAddressTwo', 'navAddress']
    if (!req || lodash.intersection(Object.keys(req.params), required).length !== required.length) {
      reject(new Error('PARAMS_ERROR', 'TRANS_CTRL_001', 'Failed to receive params'))
      return
    }

    TransactionCtrl.runtime = { req, res }

    TransactionCtrl.runtime.transaction = new TransactionModel({
      changelly_id: req.params.changellyId || '123123123',
      polymorph_id: req.params.polymorphId,
      polymorph_pass: req.params.polymorphPass,
      changelly_address_one: req.params.changellyAddressOne,
      changelly_address_two: req.params.changellyAddressTwo,
      order_amount: req.params.amount,
      nav_address: req.params.navAddress,
      input_currency: req.params.from,
      output_currency: req.params.to,
      output_address: req.params.address,
      order_status: 'CREATED',
      delay: req.params.delay || 0,
      created: new Date(),
      sent: null,
    })
    TransactionCtrl.runtime.transaction.save()
    .then(() => fulfill())
    .catch(err => reject(err))
  })
}

TransactionCtrl.getOrder = (id, pass) => {
  return new Promise((fulfill, reject) => {
    const query = TransactionModel.find()
    if (!id || !pass) {
      reject(new Error('Id or Password missing. Id: ' + id + '. Pass: ' + pass))
      return
    }
    query.and([{ polymorph_id: id }, { polymorph_pass: pass }])
    query.select('-_id polymorph_id polymorph_pass changelly_address_one changelly_id ' +
      'order_amount input_currency output_currency order_status')
    query.exec()
    .then((order) => { fulfill(order) })
    .catch((error) => { reject(error) })
  })
}

TransactionCtrl.updateOrderStatus = (id, pass, newStatus) => {
  return new Promise((fulfill, reject) => {
    if (!id || !pass || !newStatus) {
      reject(new Error('Id, Password or Status missing. Id: ' + id + '. Pass: ' + pass + '. Status: ' + newStatus))
      return
    }
    const query = { polymorph_id: id, polymorph_pass: pass }
    TransactionModel.findOneAndUpdate(query, { order_status: newStatus })
    .then(() => {
      fulfill()
    })
    .catch((error) => { reject(error) })
  })
}

TransactionCtrl.getTransaction = (req, res) => {
  TransactionCtrl.runtime = { res, req }
  const query = TransactionModel.find()
  if (req.params && req.params.id) {
    query.where('_id').equals(req.params.id)
  }
  query.exec(TransactionCtrl.gotTransaction)
}

TransactionCtrl.gotTransaction = (err, transactions) => {
  if (err) {
    ErrorHandler.handleError({
      statusMessage: 'Failed to get transaction',
      err,
      code: 'TRANS_CTRL_003',
      sendEmail: false,
      res: TransactionCtrl.runtime.res
    })
    return
  }
  TransactionCtrl.runtime.res.send(JSON.stringify({
    status: 200,
    type: 'SUCCESS',
    data: transactions,
  }))
}

TransactionCtrl.checkIfIdExists = (polymorphId) => {
  return new Promise((fulfill, reject) => {
    const query = TransactionModel.find()
    try {
      if (polymorphId) {
        query.where('polymorph_id').equals(polymorphId)
      } else {
        reject(new Error('Incorrect Params - No Polymorph ID'))
        return
      }
      query.exec()
      .then((result) => {
        if (result.length !== 0) {
          fulfill(true)
          return
        }
        fulfill(false)
      })
      .catch((error) => { reject(error) })
    } catch (exception) {
      reject(exception)
    }
  })
}

module.exports = TransactionCtrl
