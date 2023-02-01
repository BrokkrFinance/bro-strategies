import "@mangrovedao/hardhat-test-solidity"
import "@nomicfoundation/hardhat-chai-matchers"
import "@nomicfoundation/hardhat-network-helpers"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"
import "@openzeppelin/hardhat-defender"
import "@openzeppelin/hardhat-upgrades"
import "@typechain/hardhat"
import * as dotenv from "dotenv"
import "hardhat-change-network"
import "hardhat-contract-sizer"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"

import "./tasks/deploy"
import "./tasks/upgrade"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  defender: {
    apiKey: `${process.env.DEFENDER_TEAM_API_KEY}`,
    apiSecret: `${process.env.DEFENDER_TEAM_API_SECRET_KEY}`,
  },
  etherscan: {
    apiKey: {
      avalanche: `${process.env.SNOWTRACE_API_KEY}`,
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      blockGasLimit: 30_000_000,
      forking: {
        //url: "https://bsc.getblock.io/bc79cd50-8a54-413c-b0f6-5af795da0345/mainnet/",
        url: "https://nd-297-861-567.p2pify.com/763dd8e4dd3f92cfab52baea4bda7661",
        enabled: true,
        //blockNumber: 23892471,
      },
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      gas: 5_000_000,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    tenderly: {
      url: `${process.env.TENDERLY_FORK_URL}`,
      chainId: 43114,
      accounts: [`0x${process.env.TENDERLY_PRIVATE_KEY}`],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 150000,
  },
  // contractSizer: {
  //   alphaSort: true,
  //   runOnCompile: true,
  //   strict: true,
  // },
}

export default config
