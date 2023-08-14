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
import { Avalanche } from "./constants/networks/Avalanche"
import { Arbitrum } from "./test/dca/chains/Arbitrum"

dotenv.config()
const arbitrumChainConfig = Arbitrum()

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
      arbitrumOne: `${process.env.ARBI_SCAN_API_KEY}`,
    },
  },
  networks: {
    hardhat: {
      // The gas estimation for contract deployment will use the settings here, even if the network is specified.
      // Constract size is set to unlimited to be able to keep tests for contracts that temorarily went over the size limit.
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    avalanche: {
      url: Avalanche().url,
      chainId: Avalanche().chainId,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: `${arbitrumChainConfig.url}`,
      chainId: arbitrumChainConfig.chainId,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
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
  //   contractSizer: {
  //     alphaSort: true,
  //     runOnCompile: true,
  //     strict: true,
  //   },
  mocha: {
    timeout: 200000,
    //bail: true,
  },
}

export default config
