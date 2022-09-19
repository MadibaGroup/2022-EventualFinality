const { utils, providers, Wallet } = require("ethers");
const {
  EthBridger,
  getL2Network,
  L1ToL2MessageStatus,
  addCustomNetwork,
} = require("@arbitrum/sdk");
const { parseEther } = utils;

const walletPrivateKey = process.env.PRIVKEY;

const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);

const l1Wallet = new Wallet(walletPrivateKey, l1Provider);
const l2Wallet = new Wallet(walletPrivateKey, l2Provider);

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
    bridge: "0xacb786ae71f5735b71009eddac303dfdce6610da",
    inbox: "0x77f693f573e28aec10ffdb3843545538867baece",
    sequencerInbox: "0x5da4a54e5c71c23e0b4af9feb3419d7ea61f8658",
    outbox: "0x45d3135b3455f5d25c7149f1164f2327aeb479fd",
    rollup: "0xc541a6ea1f4349d9fb7e1f9bfd31c9766bb8f95a",
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
  //console.log(l2goerliNitroTest.ethBridge)
  const newNetwork = addCustomNetwork({
    customL1Network: l1localTestNetwork,
    customL2Network: l2localTestNetwork,
  });

  const l2Network = await getL2Network(l2Provider);
  const ethBridger = new EthBridger(l2Network);

  /**
   * First, let's check the l2Wallet initial ETH balance
   */
  const l2WalletInitialEthBalance = await l2Wallet.getBalance();

  const ethToL2DepositAmount = parseEther("0.0001");

  /* transfer ether from L1 to L2
   * This convenience method automatically queries for the retryable's max submission cost and forwards the appropriate amount to L2
   * Arguments required are:
   * (1) amount: The amount of ETH to be transferred to L2
   * (2) l1Signer: The L1 address transferring ETH to L2
   * (3) l2Provider: An l2 provider
   */
  const depositTx = await ethBridger.deposit({
    amount: ethToL2DepositAmount,
    l1Signer: l1Wallet,
    l2Provider: l2Provider,
  });

  const depositRec = await depositTx.wait();
  console.warn("deposit L1 receipt is:", depositRec.transactionHash);

  /**
   * With the transaction confirmed on L1, we now wait for the L2 side (i.e., balance credited to L2) to be confirmed as well.
   * Here we're waiting for the Sequencer to include the L2 message in its off-chain queue. The Sequencer should include it in under 10 minutes.
   */
  console.warn("Now we wait for L2 side of the transaction to be executed ⏳");
  const l2Result = await depositRec.waitForL2(l2Provider);

  /**
   * The `complete` boolean tells us if the l1 to l2 message was successul
   */
  l2Result.complete
    ? console.log(
        `L2 message successful: status: ${L1ToL2MessageStatus[l2Result.status]}`
      )
    : console.log(
        `L2 message failed: status ${L1ToL2MessageStatus[l2Result.status]}`
      );

  /**
   * Our l2Wallet ETH balance should be updated now
   */
  const l2WalletUpdatedEthBalance = await l2Wallet.getBalance();
  console.log(
    `your L2 ETH balance is updated from ${l2WalletInitialEthBalance.toString()} to ${l2WalletUpdatedEthBalance.toString()}`
  );
};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
