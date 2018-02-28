'use strict'

const serverModeCtrl = require('../db/serverMode.ctrl')
const logger = require('../logger')


const SocketCtrl = {}

SocketCtrl.setupServerSocket = (socket) => {
  return new Promise((fufill, reject) => {
    try {
      socket.on('connection', function(socket){
        console.log('a user connected')
        socket.on('disconnect', function(){
          console.log('USER DISCONNECTED')
        })
        socket.on('ADD_MESSAGE', (message) => {
          socket.emit('MESSAGE', { type: 'NEW_MESSAGE', text: message })
        })
        serverModeCtrl.checkMode().then((currServerMode) => {
          socket.emit('SERVER_MODE', currServerMode[0].server_mode)
        })
      })
      SocketCtrl.startDbWatch(socket)
      fufill()
    } catch (err) {
      reject(err)
    }
  })
}

// SocketCtrl.startDbWatch = socket => {
//   let mode = 'MAINTENANCE'
//   setInterval( () => {
//     mode = mode === 'MAINTENANCE' ? 'LIVE' : 'MAINTENANCE'
//     socket.emit('SERVER_MODE', mode)
//   }, 1000)
// }

SocketCtrl.startDbWatch = (socket) => {
  let previousMode
  let previousMessage
  setInterval(() => {
    serverModeCtrl.checkMode()
    .then((currServerMode) => {
      if (currServerMode.length === 1 && previousMode !== currServerMode[0].server_mode) {
        previousMode = currServerMode[0].server_mode
        socket.emit('SERVER_MODE', currServerMode[0].server_mode)
      }
    })
    .then(() => {
      return serverModeCtrl.checkMessage()
    })
    .then((currServerMessageData) => {
      if (currServerMessageData.length === 1 && previousMessage !== currServerMessageData) {
        previousMessage = currServerMessageData
        socket.emit('SERVER_MESSAGE', {
          serverMessage: currServerMessageData[0].server_message,
          serverMessageType: currServerMessageData[0].message_type,
          showMessage: currServerMessageData[0].show_message,
        })
      }
    })
    .catch((err) => {
      logger.writeLog('SKT_001', 'Something went wrong with the socket(s)', { error: err }, false)
    })
  }, 1000)
}

module.exports = SocketCtrl
