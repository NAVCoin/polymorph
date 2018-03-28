const Client = require('bitcoin-core')
const configData = require('../../server-settings')

let rpc = new Client(configData.navClient)
rpc.nav = {}

rpc.nav.unlockWallet = async () => {
  try {
    await rpc.walletPassphrase(configData.navClient.walletPassphrase, configData.navClient.walletUnlockTime)
    return true
  } catch (err) {
    if (err.message.includes('unencrypted')) {
      // wallet wasn't encrypted, therefore we can treat it as unlocked
      return true
    } else {
      logger.writeErrorLog('RPC_001', err.message, err)
      return false
    }
  }
}

rpc.nav.getNewAddress = async () => {
  // Get an unused address from our address pool
  try {
    return await rpc.getNewAddress()
  } catch (err) {
    if (err.code === -12) {
      // We're out of addresses in our prestocked pool. Try refill
      try {
        await rpc.keypoolRefill()
        return await rpc.getNewAddress()
      } catch (err2) {
        // Errored again. Guess we can't refill it
        logger.writeErrorLog('RPC_002', err.message, err)
        return false
      }
    } else {
      logger.writeErrorLog('RPC_003', err.message, err)
      return false
    }
  }
}

rpc.nav.listUnspentTx = async () => {
  // list unspent transactions from the wallet
  try {
    return await rpc.listUnspent()
  } catch (err) {
    logger.writeErrorLog('RPC_004', err.message, err)
    return false
  }
}

module.exports = rpc
