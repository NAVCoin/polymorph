// Get dependencies
const express = require('express')
const path = require('path')
const https = require('https')
const bodyParser = require('body-parser')
const pem = require('pem')
const mongoose = require('mongoose')
const socketCtrl = require('./server/lib/socket/socketCtrl')


// Get our API routes
const api = require('./server/routes/api')
const Logger = require('./server/lib/logger')

// Get Config data
const config = require('./server-settings.json')
// const validator = require('./server/config-validator')

const app = express()

//validateConfig(config)

// Parsers for POST data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// Point static path to dist
app.use(express.static(path.join(__dirname, config.app.static)))

// Set our api routes
app.use(config.app.apiUri, api)

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, config.app.catchAllUri))
})

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || config.serverPort
app.set('port', port)

/**
 * Create HTTPS server, set up sockets and listen on all network interfaces
 */

var server
var io

pem.createCertificate(config.sslCert, (error, keys) => {
  if (error) {
    console.log('pem error: ' + error)
  }
  const sslOptions = {
    key: keys.serviceKey,
    cert: keys.certificate,
    requestCert: false,
    rejectUnauthorized: false,
  }
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: true,
  }))
  server = https.createServer(sslOptions, app)
  io = require('socket.io')(server);

  socketCtrl.setupServerModeSocket(io)
  .then(() => {
    Logger.writeLog('n/a', 'Server Mode Socket Running', null, false)
  })
  .catch((err) => {
    Logger.writeLog('001', 'Failed to start up Server Mode Socket', err, true)
  })

  server.listen(port, () => {
    Logger.writeLog('n/a', `API running on https://localhost:${port}`, null, false)

    /**
    * Connect to mongoose
    */
    
    mongoose.Promise = global.Promise
    const mongoDB = config.mongoDBUrl
    mongoose.connect(mongoDB)
    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'MongoDB connection error:'))
    
    Logger.writeLog('MongoDB Connect', `Conected to MongoDB on ${mongoDB}`, null, false)

    Logger.writeLog('n/a', 'Sending start up notification email.', null, false)
    Logger.writeLog('Server Start Up', 'Start Up Complete @' + new Date().toISOString() +
      ', Polymorph Version: ' + config.version, null, true)
  })
})

