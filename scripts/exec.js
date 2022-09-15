const { utils, providers, Wallet } = require('ethers')

const {
    EthBridger,
    getL2Network,
    L1ToL2MessageStatus,
    addCustomNetwork,
    L2TransactionReceipt,
    L2ToL1MessageStatus
  } = require('@arbitrum/sdk')
  const { parseEther } = utils

const walletPrivateKey = process.env.PRIVKEY

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC)
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC)

const l1Wallet = new Wallet(walletPrivateKey, l1Provider)
const l2Wallet = new Wallet(walletPrivateKey, l2Provider)

const ethToL2DepositAmount = parseEther('0.0001')

const main = async () => {

const LocalTokenBridge = {
    l1GatewayRouter: '0x4c7708168395aEa569453Fc36862D2ffcDaC588c',
    l2GatewayRouter: '0xE5B9d8d42d656d1DcB8065A6c012FE3780246041',
    l1ERC20Gateway: '0x715D99480b77A8d9D603638e593a539E21345FdF',
    l2ERC20Gateway: '0x2eC7Bc552CE8E51f098325D2FcF0d3b9d3d2A9a2',
    l1CustomGateway: '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7',
    l2CustomGateway: '0x8b6990830cF135318f75182487A4D7698549C717',
    l1WethGateway: '0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502',
    l2WethGateway: '0xf9F2e89c8347BD96742Cc07095dee490e64301d6',
    l2Weth: '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
    l1Weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    l1ProxyAdmin: '0x0DbAF24efA2bc9Dd1a6c0530DD252BCcF883B89A',
    l2ProxyAdmin: '0x58816566EB91815Cc07f3Ad5230eE0820fe1A19a',
    l1MultiCall: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
    l2Multicall: '0x5D6e06d3E154C5DBEC91317f0d04AE03AB49A273',
  }
  const LocalETHBridge = {
    bridge: '0x2ce2c9a91390cd456189a30861d8d96e8d1823dc',
    inbox: '0xcaa7817bfdcfc5ba0945eeac19d466a357506f69',
    sequencerInbox: '0xaa76734360025bdf0db51a5d28bb9587128b2e40',
    outbox: '0x9f65607c59db4b2bef19b160ea21bdde34ff1028',
    rollup: '0x3713b9016ff516af09d4c98838c618b8dcd611eb',
  }
  
  const l1localTestNetwork = {
    chainID: 1337,
    name: 'l1localTestNetwork',
    explorerUrl: 'https://goerli.etherscan.io/',
    partnerChainIDs: [412346],
    blockTime: 15,
    rpcURL: 'http://localhost:8545',
    isCustom: true,
  }
  
  const l2localTestNetwork= {
    chainID: 412346,
    name: 'l2localTestNetwork',
    explorerUrl: 'https://goerli-rollup-explorer.arbitrum.io/',
    partnerChainID: 1337,
    isArbitrum: true,
    tokenBridge: LocalTokenBridge,
    ethBridge: LocalETHBridge,
    confirmPeriodBlocks: 1,
    rpcURL: 'http://localhost:8547',
    isCustom: true,
    retryableLifetimeSeconds: 604800,
  }
  //console.log(l2goerliNitroTest.ethBridge)
  const newNetwork = addCustomNetwork({customL1Network:l1localTestNetwork,customL2Network: l2localTestNetwork})

  //   const l2Network = await getL2Network(l2Provider)
  //   const ethBridger = new EthBridger(l2Network)

  //   /**
  //   * First, let's check the l2Wallet initial ETH balance
  //   */
  //   const l2WalletInitialEthBalance = await l2Wallet.getBalance()


  //  /* transfer ether from L1 to L2
  //   * This convenience method automatically queries for the retryable's max submission cost and forwards the appropriate amount to L2
  //   * Arguments required are:
  //   * (1) amount: The amount of ETH to be transferred to L2
  //   * (2) l1Signer: The L1 address transferring ETH to L2
  //   * (3) l2Provider: An l2 provider
  //   */
  //   const depositTx = await ethBridger.deposit({
  //    amount: ethToL2DepositAmount,
  //    l1Signer: l1Wallet,
  //    l2Provider: l2Provider,
  //   })

  //   const depositRec = await depositTx.wait()
  //   console.warn('deposit L1 receipt is:', depositRec.transactionHash)

  // /**
  //  * With the transaction confirmed on L1, we now wait for the L2 side (i.e., balance credited to L2) to be confirmed as well.
  //  * Here we're waiting for the Sequencer to include the L2 message in its off-chain queue. The Sequencer should include it in under 10 minutes.
  //  */
  //   console.warn('Now we wait for L2 side of the transaction to be executed ⏳')
  //   const l2Result = await depositRec.waitForL2(l2Provider)

  // /**
  //  * The `complete` boolean tells us if the l1 to l2 message was successul
  //  */
  //   l2Result.complete
  //       ? console.log(
  //           `L2 message successful: status: ${L1ToL2MessageStatus[l2Result.status]}`
  //     )
  //       : console.log(
  //           `L2 message failed: status ${L1ToL2MessageStatus[l2Result.status]}`
  //     )

  // /**
  //  * Our l2Wallet ETH balance should be updated now
  //  */
  //   const l2WalletUpdatedEthBalance = await l2Wallet.getBalance()
  //   console.log(
  //   `your L2 ETH balance is updated from ${l2WalletInitialEthBalance.toString()} to ${l2WalletUpdatedEthBalance.toString()}`
  // )


  //++++++++++++++++++++++++withdraw+++++++++++++++++++++
  // const ethFromL2WithdrawAmount = parseEther('0.00000001')

  
  //   /**
  //    * Use l2Network to create an Arbitrum SDK EthBridger instance
  //    * We'll use EthBridger for its convenience methods around transferring ETH from L2 to L1
  //    */
  
  //   const l2Network = await getL2Network(l2Provider)
  //   const ethBridger = new EthBridger(l2Network)
  
  //   /**
  //    * First, let's check our L2 wallet's initial ETH balance and ensure there's some ETH to withdraw
  //    */
  //   const l2WalletInitialEthBalance = await l2Wallet.getBalance()
  
  //   if (l2WalletInitialEthBalance.lt(ethFromL2WithdrawAmount)) {
  //     console.log(
  //       `Oops - not enough ether; fund your account L2 wallet currently ${l2Wallet.address} with at least 0.000001 ether`
  //     )
  //     process.exit(1)
  //   }
  //   console.log('Wallet properly funded: initiating withdrawal now')
  
  //   /**
  //    * We're ready to withdraw ETH using the ethBridger instance from Arbitrum SDK
  //    * It will use our current wallet's address as the default destination
  //    */
  
  //   const withdrawTx = await ethBridger.withdraw({
  //     amount: ethFromL2WithdrawAmount,
  //     l2Signer: l2Wallet,
  //   })
  //   const withdrawRec = await withdrawTx.wait()
  
  //   /**
  //    * And with that, our withdrawal is initiated! No additional time-sensitive actions are required.
  //    * Any time after the transaction's assertion is confirmed, funds can be transferred out of the bridge via the outbox contract
  //    * We'll display the withdrawals event data here:
  //    */
  //   console.log(`Ether withdrawal initiated! 🥳 ${withdrawRec.transactionHash}`)
  
  //   const withdrawEventsData = await withdrawRec.getL2ToL1Events()
  //   console.log('Withdrawal data:', withdrawEventsData)
  //   console.log(
  //     `To to claim funds (after dispute period), see outbox-execute repo ✌️`
  //  )

  //++++++++++++++++++++++++execute+++++++++++++++++++++
  const receipt = await l2Provider.getTransactionReceipt("0xdfbff1f25362b044acefe91ecf92491ac6495ab1b105b3fb91cdf45fc3ee40b0")
  const l2Receipt = new L2TransactionReceipt(receipt)

  /**
   * Note that in principle, a single transaction could trigger any number of outgoing messages; the common case will be there's only one.
   * For the sake of this script, we assume there's only one / just grad the first one.
   */
  const messages = await l2Receipt.getL2ToL1Messages(l1Wallet, l2Provider)
  const l2ToL1Msg = messages[0]

  /**
   * Check if already executed
   */
  if ((await l2ToL1Msg.status(l2Provider)) == L2ToL1MessageStatus.EXECUTED) {
    console.log(`Message already executed! Nothing else to do here`)
    process.exit(1)
  }

  /**
   * before we try to execute out message, we need to make sure the l2 block it's included in is confirmed! (It can only be confirmed after the dispute period; Arbitrum is an optimistic rollup after-all)
   * waitUntilReadyToExecute() waits until the item outbox entry exists
   */
  const timeToWaitMs = 1000 * 60
  console.log(
    "Waiting for the outbox entry to be created. This only happens when the L2 block is confirmed on L1, ~1 week after it's creation."
  )
  await l2ToL1Msg.waitUntilReadyToExecute(l2Provider, timeToWaitMs)
  console.log('Outbox entry exists! Trying to execute now')

  /**
   * Now that its confirmed and not executed, we can execute our message in its outbox entry.
   */
  const res = await l2ToL1Msg.execute(l2Provider)
  const rec = await res.wait()
  console.log('Done! Your transaction is executed', rec)

}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })