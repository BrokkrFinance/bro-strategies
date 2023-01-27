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
//import "hardhat-contract-sizer"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"
import avalanche from "./constants/networks/Avalanche.json"
import avalancheTest from "./constants/networks/AvalancheTest.json"
import bsc from "./constants/networks/BSC.json"
import bscTest from "./constants/networks/BSCTest.json"

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
      bsc: `${process.env.BSC_SCAN_API_KEY}`,
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    avalanche: {
      url: avalanche.url,
      chainId: avalanche.chainId,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    avalanche_test: {
      url: avalancheTest.url,
      chainId: avalancheTest.chainId,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      gas: 5_000_000,
    },
    bsc: {
      url: bsc.url,
      chainId: bsc.chainId,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    bsc_test: {
      url: bscTest.url,
      chainId: bscTest.chainId,
      accounts: [`0x${process.env.TESTNET_PRIVATE_KEY}`],
      gasPrice: 20_000_000_000,
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
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true,
  },
}

export default config
