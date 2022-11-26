import { Contract } from "ethers"
import { task } from "hardhat/config"
import path from "path"
import {
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  deployUUPSUpgradeableStrategyRoleable,
  verifyContract,
} from "../scripts/helper/contract"
import { getLiveConfigPath, readLiveConfig, writeLiveConfig } from "../scripts/helper/paths"
import { LiveConfig } from "../scripts/interfaces/configs"
import { Library } from "../scripts/interfaces/library"
import { NameValuePair } from "../scripts/interfaces/name-value-pair"
import {
  InvestmentTokenArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyExtraArgs,
  StrategyLibraries,
} from "../scripts/interfaces/parameters"
import { RoleToUsers } from "../scripts/interfaces/role-to-users"

task("deploy", "Deploy an investable contract")
  .addParam("type", "A type of investable such as portfolio or strategy")
  .addParam("subtype", "A type of strategy such as ownable or roleable")
  .addParam("name", "A unique name of an investable such as StargateUSDC")
  .addParam("owner", "An address of owner")
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
  .setAction(async (taskArgs) => {
    console.log(`Deploy: Deploy ${taskArgs.name} ${taskArgs.type}.`)

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

    const name = path.join(taskArgs.type, taskArgs.name)

    writeLiveConfig(name, {
      name: taskArgs.name,
      address: investable.address,
      owner: taskArgs.owner,
    })

    console.log(`Deploy: Corresponding live config is created at ${getLiveConfigPath(name)}.`)

    console.log("Deploy: Verify the new contract.\n")

    await verifyContract(investable.address)

    console.log()
  })

function parseInvestmentTokenArgs(taskArgs: any): InvestmentTokenArgs {
  return {
    name: taskArgs.investmentTokenName,
    symbol: taskArgs.investmentTokenSymbol,
  }
}

function parsePortfolioArgs(taskArgs: any): PortfolioArgs {
  return {
    depositToken: taskArgs.depositToken,
    depositFee: {
      amount: taskArgs.depositFee,
      params: parseParams(taskArgs.depositFeeParamKeys, taskArgs.depositFeeParamValues),
    },
    withdrawalFee: {
      amount: taskArgs.withdrawalFee,
      params: parseParams(taskArgs.withdrawalFeeParamKeys, taskArgs.withdrawalFeeParamValues),
    },
    performanceFee: {
      amount: taskArgs.performanceFee,
      params: parseParams(taskArgs.performanceFeeParamKeys, taskArgs.performanceFeeParamValues),
    },
    feeReceiver: {
      address: taskArgs.feeReceiver,
      params: parseParams(taskArgs.feeReceiverParamKeys, taskArgs.feeReceiverParamValues),
    },
    investmentLimit: { total: taskArgs.totalInvestmentLimit, perAddress: taskArgs.investmentLimitPerAddress },
  }
}

function parsePortfolioExtraArgs(stringfiedArgs: string): PortfolioExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

function parseStrategyArgs(taskArgs: any): StrategyArgs {
  return {
    depositToken: taskArgs.depositToken,
    depositFee: {
      amount: taskArgs.depositFee,
      params: parseParams(taskArgs.depositFeeParamKeys, taskArgs.depositFeeParamValues),
    },
    withdrawalFee: {
      amount: taskArgs.withdrawalFee,
      params: parseParams(taskArgs.withdrawalFeeParamKeys, taskArgs.withdrawalFeeParamValues),
    },
    performanceFee: {
      amount: taskArgs.performanceFee,
      params: parseParams(taskArgs.performanceFeeParamKeys, taskArgs.performanceFeeParamValues),
    },
    feeReceiver: {
      address: taskArgs.feeReceiver,
      params: parseParams(taskArgs.feeReceiverParamKeys, taskArgs.feeReceiverParamValues),
    },
    investmentLimit: { total: taskArgs.totalInvestmentLimit, perAddress: taskArgs.investmentLimitPerAddress },
    oracle: { name: taskArgs.oracleName, address: taskArgs.oracleAddress },
    swapService: { provider: taskArgs.swapServiceProvider, router: taskArgs.swapServiceRouter },
    roleToUsers: parseRoleToUsers(taskArgs.roles, taskArgs.users),
  }
}

function parseStrategyExtraArgs(stringfiedArgs: string): StrategyExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

function parseStrategyLibraries(
  stringfiedLibraryNames: string,
  stringfiedLibraryDependencies: string
): StrategyLibraries {
  return {
    libraries: parseLibraries(stringfiedLibraryNames, stringfiedLibraryDependencies),
  }
}

function parseParams(stringfiedKeys: string, stringfiedValues: string): NameValuePair[] {
  if (stringfiedKeys === "[]" && stringfiedValues === "[]") {
    return []
  }

  const keys: string[] = stringfiedKeys.slice(1, -1).split(",")
  const values: string[] = stringfiedValues.slice(1, -1).split(",")

  if (keys.length != values.length) {
    console.log("Deploy: Fee params must have the same length of keys and values.")
    throw new Error("Wrong config file")
  }

  const params: NameValuePair[] = []

  keys.forEach((key: string, index: number) => {
    params.push({
      key: key,
      value: values[index],
    })
  })

  return params
}

function parseExtraArgs(stringfiedArgs: string): string[] | string[][] {
  if (stringfiedArgs === "[]") {
    return []
  }

  let extraArgs: string[] | string[][]

  if (stringfiedArgs.startsWith("[[") === true && stringfiedArgs.endsWith("]]") === true) {
    extraArgs = [stringfiedArgs.slice(2, -2).split(",")]
  } else {
    extraArgs = stringfiedArgs.slice(1, -1).split(",")
  }

  return extraArgs
}

function parseInvestables(stringfiedInvestables: string): string[] {
  if (stringfiedInvestables === "[]") {
    return []
  }

  const investableNames: string[] = stringfiedInvestables.slice(1, -1).split(",")
  const investableAddrs: string[] = []

  for (let investableName of investableNames) {
    const liveConfig: LiveConfig = readLiveConfig(investableName)

    investableAddrs.push(liveConfig.address)
  }

  return investableAddrs
}

function parseAllocations(stringfiedAllocations: string): number[][] {
  if (stringfiedAllocations === "[]") {
    return []
  }

  const allocations = stringfiedAllocations
    .slice(1, -1)
    .match(/(?<=\[)(.*?)(?=\])/g)!
    .map((allocations: string): number[] => {
      return allocations.split(",").map((allocation: string): number => Number(allocation))
    })

  return allocations
}

function parseRoleToUsers(stringfiedRoles: string, stringfiedUsers: string): RoleToUsers[] {
  if (stringfiedRoles === "[]" && stringfiedUsers === "[]") {
    return []
  }

  const roles: string[] = stringfiedRoles.slice(1, -1).split(",")
  const users = stringfiedUsers
    .slice(1, -1)
    .match(/(?<=\[)(.*?)(?=\])/g)!
    .map((users: string): string[] => {
      return users.split(",")
    })

  if (roles.length != users.length) {
    console.log("Deploy: RoleToUsers must have the same length of roles and users.")
    throw new Error("Wrong config file")
  }

  const params: RoleToUsers[] = []

  roles.forEach((role: string, index: number) => {
    params.push({
      role: role,
      users: users[index],
    })
  })

  return params
}

function parseLibraries(stringfiedLibraryNames: string, stringfiedLibraryDependencies: string): Library[] {
  if (stringfiedLibraryNames === "[]" && stringfiedLibraryDependencies === "[]") {
    return []
  }

  const names: string[] = stringfiedLibraryNames.slice(1, -1).split(",")
  const dependencies = stringfiedLibraryDependencies
    .slice(1, -1)
    .match(/(?<=\[)(.*?)(?=\])/g)!
    .map((dependency: string): string[] => {
      return dependency.split(",")
    })

  if (names.length != dependencies.length) {
    console.log("Deploy: Library must have the same length of names and dependencies.")
    throw new Error("Wrong config file")
  }

  const params: Library[] = []

  names.forEach((name: string, index: number) => {
    params.push({
      name: name,
      dependencies: dependencies[index],
    })
  })

  return params
}
