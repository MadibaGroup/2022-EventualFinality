const { providers, Wallet, ethers } = require("ethers");
const {
  addCustomNetwork,
  L2TransactionReceipt
} = require("@arbitrum/sdk");

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);

const Alicel1Wallet = new Wallet(process.env.Alice_PRIVKEY, l1Provider);
const Bobl1Wallet = new Wallet(process.env.Bob_PRIVKEY, l1Provider);
const Caroll11Wallet = new Wallet(process.env.Carol_PRIVKEY, l1Provider);
const Nancyl11Wallet = new Wallet(process.env.Nancy_PRIVKEY, l1Provider);



const main = async () => {
  const LocalTokenBridge = {
    l1GatewayRouter: "0x4c7708168395aEa569453Fc36862D2ffcDaC588c",
    l2GatewayRouter: "0xE5B9d8d42d656d1DcB8065A6c012FE3780246041",
    l1ERC20Gateway: "0x715D99480b77A8d9D603638e593a539E21345FdF",
    l2ERC20Gateway: "0x2eC7Bc552CE8E51f098325D2FcF0d3b9d3d2A9a2",
    l1CustomGateway: "0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7",
    l2CustomGateway: "0x8b6990830cF135318f75182487A4D7698549C717",
    l1WethGateway: "0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502",
    l2WethGateway: "0xf9F2e89c8347BD96742Cc07095dee490e64301d6",
    l2Weth: "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3",
    l1Weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    l1ProxyAdmin: "0x0DbAF24efA2bc9Dd1a6c0530DD252BCcF883B89A",
    l2ProxyAdmin: "0x58816566EB91815Cc07f3Ad5230eE0820fe1A19a",
    l1MultiCall: "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
    l2Multicall: "0x5D6e06d3E154C5DBEC91317f0d04AE03AB49A273",
  };
  const LocalETHBridge = {
    bridge: "0x2d8f508c9fb4f935d0bf2ea564668301b33672b0",
    inbox: "0xf8e40b2737d8d2bbc9613c607327166d27cec4db",
    sequencerInbox: "0x6cd6e23364159988080db3b719be13c95244855f",
    outbox: "0xf2e4f13b9278356d5f0a85122e63600a93ed6507",
    rollup: "0xb292907c55d4a11ee6c9fb15586f4d3e3125b588",
  };

  const l1localTestNetwork = {
    chainID: 1337,
    name: "l1localTestNetwork",
    explorerUrl: "https://goerli.etherscan.io/",
    partnerChainIDs: [412346],
    blockTime: 15,
    rpcURL: "http://localhost:8545",
    isCustom: true,
  };

  const l2localTestNetwork = {
    chainID: 412346,
    name: "l2localTestNetwork",
    explorerUrl: "https://goerli-rollup-explorer.arbitrum.io/",
    partnerChainID: 1337,
    isArbitrum: true,
    tokenBridge: LocalTokenBridge,
    ethBridge: LocalETHBridge,
    confirmPeriodBlocks: 1,
    rpcURL: "http://localhost:8547",
    isCustom: true,
    retryableLifetimeSeconds: 604800,
  };
  const newNetwork = addCustomNetwork({
    customL1Network: l1localTestNetwork,
    customL2Network: l2localTestNetwork,
  });
  
  // const transfer1tx = await Alicel1Wallet.sendTransaction({
  //   to: Bobl1Wallet.address,
  //   value: ethers.utils.parseEther("10")
  // });
  // transfer1tx.wait()

  // const transfer2tx = await Alicel1Wallet.sendTransaction({
  //   to: Caroll11Wallet.address,
  //   value: ethers.utils.parseEther("10")
  // });
  // transfer2tx.wait()

  const transfer3tx = await Alicel1Wallet.sendTransaction({
    to: Nancyl11Wallet.address,
    value: ethers.utils.parseEther("10")
  });
  transfer3tx.wait()

  // const l1WalleEthBalance = await SecondL1Wallet.getBalance()
  // console.log(l1WalleEthBalance.toString())
  // console.log(SecondL1Wallet.address)

  const receipt = await l2Provider.getTransactionReceipt(
    "0x9c152655a215b8d4a2e8fa73301ed4b5691b7869ba6066e59310c6ed0ea6654e"
  ); 
  const l2Receipt = new L2TransactionReceipt(receipt);

  /**
   * Note that in principle, a single transaction could trigger any number of outgoing messages; the common case will be there's only one.
   * For the sake of this script, we assume there's only one / just grad the first one.
   */
   const messages = await l2Receipt.getL2ToL1Messages(l1Provider)
   const eventsData = await l2Receipt.getL2ToL1Events()
   const l2ToL1Msg = messages[0];
   const proofInfo = await l2ToL1Msg.getOutboxProof(l2Provider)
   
   
  const outboxAbi = [
    'function transferSpender(bytes32[],uint256,address,address,uint256,uint256,uint256,uint256,bytes,address) external',
    'function TransferredToAddress(uint256) public view returns(address)',
  ]
  
    const outboxAddress = '0xf2e4f13b9278356d5f0a85122e63600a93ed6507' //Change this after each Nitro run
    const outboxContract = new ethers.Contract(outboxAddress, outboxAbi, Caroll11Wallet)

    //console.log(await outboxContract.TransferredToAddress(eventsData[0].position))


    const transferWithdrawTx = await outboxContract.transferSpender(
        proofInfo,
        eventsData[0].position,
        eventsData[0].caller, 
        eventsData[0].destination, 
        eventsData[0].arbBlockNum,
        eventsData[0].ethBlockNum,
        eventsData[0].timestamp,
        eventsData[0].callvalue,
        eventsData[0].data,
        Nancyl11Wallet.address
    )
    const transferWithdrawRec = await transferWithdrawTx.wait()
    console.log(transferWithdrawRec)

};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
