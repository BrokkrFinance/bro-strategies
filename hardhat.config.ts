import "@mangrovedao/hardhat-test-solidity"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-solpp"
import "@nomiclabs/hardhat-waffle"
import "@openzeppelin/hardhat-upgrades"
import "@typechain/hardhat"
import * as dotenv from "dotenv"
import "hardhat-contract-sizer"
import "hardhat-deploy"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1,
      },
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      blockGasLimit: 30_000_000,
    },
    avax_mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    avax_testnet: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true,
  },
}

export default config
