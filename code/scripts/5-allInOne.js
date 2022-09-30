const { utils, providers, Wallet } = require("ethers");
const {
  EthBridger,
  getL2Network,
  addCustomNetwork,
  L2TransactionReceipt,
  L2ToL1MessageStatus,
} = require("@arbitrum/sdk");
const { parseEther } = utils;
const hre = require("hardhat");
const ethers = require("ethers");

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);

const Alicel1Wallet = new Wallet(process.env.Alice_PRIVKEY, l1Provider);
const Alicel2Wallet = new Wallet(process.env.Alice_PRIVKEY, l2Provider);
const Bobl1Wallet = new Wallet(process.env.Bob_PRIVKEY, l1Provider);

var wait = (ms) => {
  const start = Date.now();
  let now = start;
  while (now - start < ms) {
    now = Date.now();
  }
};
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
    bridge: "0x917c7d8375c2038e974a6217fa3f12aa6d337b25",
    inbox: "0x45c37efd6a4d48e4023daba9d8c92c92a49aed5e",
    sequencerInbox: "0x0724f49bee21cec96faa8a29deaa8009e22539ce",
    outbox: "0xc0e3f0e54ce478e7671411703239704b9aacad2c",
    rollup: "0x3e3c490d624b9a387599422f0a9b21873870b66d",
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

  const l2Network = await getL2Network(l2Provider);
  const ethBridger = new EthBridger(l2Network);

  const L1Market = await (
    await hre.ethers.getContractFactory("Market")
  ).connect(Alicel1Wallet);
  console.log("Deploying L1 Market");
  const l1Market = await L1Market.deploy(
    "0xc0e3f0e54ce478e7671411703239704b9aacad2c"
  );
  await l1Market.deployed();
  console.log(`Market is deployed to ${l1Market.address}`);

  console.log(
    "************************************************************************"
  );
  console.log("1- Alice initiates a withdraw");

  const ethFromL2WithdrawAmount = parseEther("0.00000001");
  const l2WalletInitialEthBalance = await Alicel2Wallet.getBalance();

  if (l2WalletInitialEthBalance.lt(ethFromL2WithdrawAmount)) {
    console.log(
      `Oops - not enough ether; fund Alice account L2 wallet currently ${Alicel2Wallet.address} with at least 0.000001 ether`
    );
    process.exit(1);
  }
  console.log("Alice wallet properly funded: initiating withdrawal now");

  /**
   * We're ready to withdraw ETH using the ethBridger instance from Arbitrum SDK
   * It will use our current wallet's address as the default destination
   */

  const withdrawTx = await ethBridger.withdraw({
    l2Signer: Alicel2Wallet,
    destinationAddress: Alicel1Wallet.address,
    amount: ethFromL2WithdrawAmount,
  });

  const withdrawRec = await withdrawTx.wait();

  /**
   * And with that, our withdrawal is initiated! No additional time-sensitive actions are required.
   * Any time after the transaction's assertion is confirmed, funds can be transferred out of the bridge via the outbox contract
   * We'll display the withdrawals event data here:
   */
  console.log(`Ether withdrawal initiated! 🥳 ${withdrawRec.transactionHash}`);

  console.log(
    "************************************************************************"
  );
  console.log(
    "2- Alice locks her exit in the market (so that she can start trading)"
  );

  wait(50000);
  const l2Receipt = new L2TransactionReceipt(withdrawRec);

  /**
   * Note that in principle, a single transaction could trigger any number of outgoing messages; the common case will be there's only one.
   * For the sake of this script, we assume there's only one / just grad the first one.
   */
  const messages = await l2Receipt.getL2ToL1Messages(l1Provider);
  const eventsData = await l2Receipt.getL2ToL1Events();
  const l2ToL1Msg = messages[0];
  const proofInfo = await l2ToL1Msg.getOutboxProof(l2Provider);

  const outboxAbi = [
    "function transferSpender(bytes32[],uint256,address,address,uint256,uint256,uint256,uint256,bytes,address) external",
    "function TransferredToAddress(uint256) public view returns(address)",
  ];

  const outboxAddress = "0xc0e3f0e54ce478e7671411703239704b9aacad2c"; //Change this after each Nitro run
  const outboxContract = new ethers.Contract(
    outboxAddress,
    outboxAbi,
    Alicel1Wallet
  );

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
    l1Market.address
  );
  const transferWithdrawRec = await transferWithdrawTx.wait();
  console.log(`Alice transferred her exit to the market! 🥳`);
  console.log(
    `Gas cost for transferring the exit to the market:  ${transferWithdrawRec.gasUsed.toString()}`
  );

  console.log(
    "************************************************************************"
  );
  console.log("3- Alice opens a market on this exit to start trading");

  wait(50000);

  const lockExitTx = await l1Market.lockExit(eventsData[0].position);
  await lockExitTx.wait();
  wait(50000);

  const OpenMarketTx = await l1Market.openMarket(
    proofInfo,
    eventsData[0].position,
    eventsData[0].caller,
    eventsData[0].destination,
    eventsData[0].arbBlockNum,
    eventsData[0].ethBlockNum,
    eventsData[0].timestamp,
    eventsData[0].callvalue,
    eventsData[0].data,
    1,
    { from: Alicel1Wallet.address }
  );

  const OpenMarketRec = await OpenMarketTx.wait();
  console.log(
    `Gas cost for openning the market:  ${OpenMarketRec.gasUsed.toString()}`
  );

  console.log(
    "************************************************************************"
  );
  console.log("4- Bob submits a bid that's greater than Alice's Ask");

  wait(50000);

  const submitBidTx = await l1Market
    .connect(Bobl1Wallet)
    .submitBid({ value: 2 });
  const submitBidRec = await submitBidTx.wait();
  console.log(
    `Gas cost for submitting the Bid:  ${submitBidRec.gasUsed.toString()}`
  );

  console.log(
    "************************************************************************"
  );
  console.log(
    "5- Anyone executes this exit from the outbox to see if Bob will recieve it or not"
  );
  wait(50000);
  /**
   * Check if already executed
   */

  const withdrawMessages = await l2Receipt.getL2ToL1Messages(
    Alicel1Wallet,
    l2Provider
  );
  const withdraL2ToL1Msg = withdrawMessages[0];

  if (
    (await withdraL2ToL1Msg.status(l2Provider)) == L2ToL1MessageStatus.EXECUTED
  ) {
    console.log(`Message already executed! Nothing else to do here`);
    process.exit(1);
  }
  /**
   * before we try to execute out message, we need to make sure the l2 block it's included in is confirmed! (It can only be confirmed after the dispute period; Arbitrum is an optimistic rollup after-all)
   * waitUntilReadyToExecute() waits until the item outbox entry exists
   */
  const timeToWaitMs = 1000 * 60;
  console.log(
    "Waiting for the outbox entry to be created, running on a custom local set-up so it should take only 1 min."
  );
  await withdraL2ToL1Msg.waitUntilReadyToExecute(l2Provider, timeToWaitMs);
  console.log("Outbox entry exists! Trying to execute now");

  const l1WalletInitialEthBalance = await Bobl1Wallet.getBalance();

  /**
   * Now that its confirmed and not executed, we can execute our message in its outbox entry.
   */
  const executeWithdrawTx = await withdraL2ToL1Msg.execute(l2Provider);
  const executeWithdrawRec = await executeWithdrawTx.wait();
  console.log(
    `Done! Your exit is executed and the gas cost for execution is: ${executeWithdrawRec.gasUsed.toString()}`
  );

  const l1WalleUpdatedEthBalance = await Bobl1Wallet.getBalance();
  console.log(
    `Bob's L1 ETH balance is updated from ${l1WalletInitialEthBalance.toString()} to ${l1WalleUpdatedEthBalance.toString()}`
  );
};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
