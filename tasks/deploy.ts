import { Contract } from "ethers"
import { task } from "hardhat/config"
import path from "path"
import {
  parseAllocations,
  parseInvestables,
  parseInvestmentTokenArgs,
  parsePortfolioArgs,
  parsePortfolioExtraArgs,
  parseStrategyArgs,
  parseStrategyExtraArgs,
  parseStrategyLibraries,
} from "./parse"
import {
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  deployUUPSUpgradeableStrategyRoleable,
  verifyContract,
} from "../scripts/helper/contract"
import { writeLiveConfig } from "../scripts/helper/files"
import { getLiveConfigPath } from "../scripts/helper/paths"

task("deploy", "Deploy an investable contract")
  .addParam("targetNetwork", "A network to deploy")
  .addParam("type", "A type of investable such as portfolio or strategy")
  .addParam("subtype", "A type of strategy such as ownable or roleable")
  .addParam("name", "A unique name of an investable such as StargateUSDC")
  .addOptionalParam("owner", "An address of owner")
  .addOptionalParam("multisig", "An address of multisig that has role(s)") // Until we have different users for different role, let's keep this simple.
  .addParam("contractName", "A name of investable")
  .addParam("investmentTokenName", "A name of investment token")
  .addParam("investmentTokenSymbol", "A symbol of investment token")
  .addParam("depositToken", "An address of deposit token")
  .addParam("depositFee", "The amount of deposit fee")
  .addParam("depositFeeParamKeys", "A list of key of each deposit fee param")
  .addParam("depositFeeParamValues", "A list of value of each deposit fee param")
  .addParam("withdrawalFee", "The amount of withdrawal fee")
  .addParam("withdrawalFeeParamKeys", "A list of key of each withdrawal fee param")
  .addParam("withdrawalFeeParamValues", "A list of value of each withdrawal fee param")
  .addParam("performanceFee", "The amount of performance fee")
  .addParam("performanceFeeParamKeys", "A list of key of each performance fee param")
  .addParam("performanceFeeParamValues", "A list of value of each performance fee param")
  .addParam("feeReceiver", "An address of fee receiver")
  .addParam("feeReceiverParamKeys", "A list of key of each fee receiver param")
  .addParam("feeReceiverParamValues", "A list of value of each fee receiver param")
  .addParam("totalInvestmentLimit", "The amount of total investment limit")
  .addParam("investmentLimitPerAddress", "The amount of investment limit per address")
  .addParam("extraArgs", "A list of investable's extra arguments")
  .addOptionalParam("oracleName", "A name of oracle")
  .addOptionalParam("oracleAddress", "An address of oracle")
  .addOptionalParam("swapServiceProvider", "Enum of swap service provider")
  .addOptionalParam("swapServiceRouter", "An address of swap service router")
  .addOptionalParam("roles", "A list of Keccak-256 of each role")
  .addOptionalParam("users", "A list of users")
  .addOptionalParam("libraryNames", "A list of library name")
  .addOptionalParam("libraryDependencies", "A list of library dependencies")
  .addOptionalParam("investables", "A list of portfolio's investables")
  .addOptionalParam("allocations", "A list of portfolio's allocations")
  .setAction(async (taskArgs, hre) => {
    console.log(`Deploy: Deploy ${taskArgs.name} ${taskArgs.type} on ${taskArgs.targetNetwork}.`)

    // Store previous network.
    const previousNetwork = hre.network.name

    // Switch to target network.
    await hre.changeNetwork(taskArgs.targetNetwork)

    // Deploy an investable contract.
    let investable: Contract

    if (taskArgs.type === "portfolio") {
      investable = await deployUUPSUpgradeablePortfolio(
        taskArgs.contractName,
        taskArgs.owner,
        parseInvestmentTokenArgs(taskArgs),
        parsePortfolioArgs(taskArgs),
        parsePortfolioExtraArgs(taskArgs.extraArgs),
        parseInvestables(taskArgs.investables),
        parseAllocations(taskArgs.allocations)
      )
    } else if (taskArgs.type === "strategy") {
      if (taskArgs.subtype === "ownable") {
        investable = await deployUUPSUpgradeableStrategyOwnable(
          taskArgs.contractName,
          taskArgs.owner,
          parseInvestmentTokenArgs(taskArgs),
          parseStrategyArgs(taskArgs),
          parseStrategyExtraArgs(taskArgs.extraArgs),
          parseStrategyLibraries(taskArgs.libraryNames, taskArgs.libraryDependencies)
        )
      } else if (taskArgs.subtype === "roleable") {
        investable = await deployUUPSUpgradeableStrategyRoleable(
          taskArgs.contractName,
          parseInvestmentTokenArgs(taskArgs),
          parseStrategyArgs(taskArgs),
          parseStrategyExtraArgs(taskArgs.extraArgs),
          parseStrategyLibraries(taskArgs.libraryNames, taskArgs.libraryDependencies)
        )
      } else {
        console.log("Deploy: The 'strategy' type must define 'subtype' key of 'ownable' or 'roleable'.")
        throw new Error("Wrong config file")
      }
    } else {
      console.log("Deploy: The config file must define 'type' key and value of 'portfolio' or 'strategy'.")
      throw new Error("Wrong config file")
    }

    console.log(`Deploy: ${taskArgs.name} ${taskArgs.type} is deployed at ${investable.address}`)

    // Write live config file.
    const name = path.join(taskArgs.type, taskArgs.name)

    if (taskArgs.subtype === "roleable") {
      writeLiveConfig(name, {
        name: taskArgs.contractName,
        address: investable.address,
        multisig: taskArgs.multisig,
      })
    } else {
      writeLiveConfig(name, {
        name: taskArgs.contractName,
        address: investable.address,
        owner: taskArgs.owner,
      })
    }

    console.log(`Deploy: Corresponding live config is created at ${getLiveConfigPath(name)}.`)

    console.log("Deploy: Verify the new contract.\n")

    // Verify contract.
    await verifyContract(investable.address)

    // Switch back to the previous network.
    await hre.changeNetwork(previousNetwork)

    console.log()
  })
