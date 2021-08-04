/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("@nomiclabs/hardhat-waffle");
 require("hardhat-gas-reporter");
 require('@openzeppelin/hardhat-upgrades');
 
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  }
  
};
