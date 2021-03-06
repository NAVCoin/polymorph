// Get dependencies
const express = require('express')
const path = require('path')
const https = require('https')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
const pem = require('pem')
const mongoose = require('mongoose')
const SocketCtrl = require('./lib/socket/socketCtrl')
const auth = require('basic-auth')
const ConfigData = require('./server-settings')
const SettingsValidator = require('./lib/settingsValidator.js')
const ProcessHandler = require('./lib/processHandler')

// Get our API routes
const api = require('./routes/api')
const Logger = require('./lib/logger')

// Get Config data
const config = require('./server-settings')

const app = express()
/**
  * Validate Server Settings Config
  */


SettingsValidator.validateSettings(config)
.then(() => {
  console.log('--------------------------------------------')
  console.log('Server Config Validated. Continuing start up')
  console.log('--------------------------------------------')

  app.startUpServer()
})
.catch((err) => {
  console.log('--------------------------------------------')
  console.log('ERR: Server Config invalid. Stopping start up')
  console.log(err)
  console.log('--------------------------------------------')
})

app.startUpServer = () => {
  // Parsers for POST data
  app.use(bodyParser.json())
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }))

  app.use((req, res, next) => {
    const user = auth(req)
    // if (user === undefined || user.name !== ConfigData.basicAuth.name || user.pass !== ConfigData.basicAuth.pass) {
    //   res.send('unauthorised access attempt')
    //   return
    // }
    next()
  })


  // Point static path to dist
  app.use(express.static(path.join(__dirname, ConfigData.app.static)))

  // Set our api routes
  app.use(ConfigData.app.apiUri, api)

  // Catch all other routes and return the index file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, ConfigData.app.catchAllUri))
  })

  /**
   * Get port from environment and store in Express.
   */
  const port = process.env.PORT || ConfigData.serverPort
  app.set('port', port)

  /**
   * Create HTTPS server, set up sockets and listen on all network interfaces
   */

  var server
  var io

  pem.createCertificate({ days: 1, selfSigned: true }, (error, keys) => {
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
    server = http.createServer(app)
    io = require('socket.io')(server)

    SocketCtrl.setupServerSocket(io)
    .then(() => {
      Logger.writeLog('n/a', 'Server Mode Socket Running', null, false)
    })
    .catch((err) => {
      Logger.writeLog('001', 'Failed to start up Server Mode Socket', err, true)
    })

    server.listen(port, () => {
      Logger.writeLog('n/a', `API running on http://localhost:${port}`, null, false)

      /**
      * Connect to mongoose
      */

      mongoose.Promise = global.Promise
      const mongoDB = ConfigData.mongoDBUrl
      mongoose.connect(mongoDB)
      const db = mongoose.connection
      db.on('error', console.error.bind(console, 'MongoDB connection error:'))

      Logger.writeLog('MongoDB Connect', `Conected to MongoDB on ${mongoDB}`, null, false)

      Logger.writeLog('n/a', 'Sending start up notification email.', null, false)
      Logger.writeLog('Server Start Up', 'Start Up Complete @' + new Date().toISOString() +
        ', Polymorph Version: ' + ConfigData.version, null, true)

      /**
      * Setup the process handler
      */

      ProcessHandler.setup()
      .then(() => {
        console.log('set up')
      })
      .catch((err) => {
        // Logger.writeLog('error msg', '' , errObj, true)
      })
    })
  })
}
