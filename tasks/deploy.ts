import { Contract } from "ethers"
import { task } from "hardhat/config"
import path from "path"
import {
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  deployUUPSUpgradeableStrategyRoleable,
  verifyContract,
} from "../scripts/helper/contract"
import { LiveConfig } from "../scripts/interfaces/configs"
import { getLiveConfigPath, readLiveConfig, writeLiveConfig } from "../scripts/helper/paths"
import { NameValuePair } from "../scripts/interfaces/name-value-pair"
import { RoleToUsers } from "../scripts/interfaces/role-to-users"
import {
  InvestmentTokenArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyExtraArgs,
} from "../scripts/interfaces/parameters"

task("deploy", "")
  .addParam("type", "")
  .addParam("subtype", "")
  .addParam("name", "")
  .addParam("owner", "")
  .addParam("contractName", "")
  .addParam("investmentTokenName", "")
  .addParam("investmentTokenSymbol", "")
  .addParam("depositToken", "")
  .addParam("depositFee", "")
  .addParam("depositFeeParamKeys", "")
  .addParam("depositFeeParamValues", "")
  .addParam("withdrawalFee", "")
  .addParam("withdrawalFeeParamKeys", "")
  .addParam("withdrawalFeeParamValues", "")
  .addParam("performanceFee", "")
  .addParam("performanceFeeParamKeys", "")
  .addParam("performanceFeeParamValues", "")
  .addParam("feeReceiver", "")
  .addParam("feeReceiverParamKeys", "")
  .addParam("feeReceiverParamValues", "")
  .addParam("totalInvestmentLimit", "")
  .addParam("investmentLimitPerAddress", "")
  .addParam("extraArgs", "")
  .addOptionalParam("oracleName", "")
  .addOptionalParam("oracleAddress", "")
  .addOptionalParam("swapServiceProvider", "")
  .addOptionalParam("swapServiceRouter", "")
  .addOptionalParam("roles", "")
  .addOptionalParam("users", "")
  .addOptionalParam("investables", "")
  .addOptionalParam("allocations", "")
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
          parseStrategyExtraArgs(taskArgs.extraArgs)
        )
      } else if (taskArgs.subtype === "roleable") {
        investable = await deployUUPSUpgradeableStrategyRoleable(
          taskArgs.contractName,
          parseInvestmentTokenArgs(taskArgs),
          parseStrategyArgs(taskArgs),
          parseStrategyExtraArgs(taskArgs.extraArgs)
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

function parsePortfolioExtraArgs(stringfiedArgs: string): PortfolioExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

function parseStrategyExtraArgs(stringfiedArgs: string): StrategyExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

function parseExtraArgs(stringfiedArgs: string): string[] {
  if (stringfiedArgs === "[]") {
    return []
  }

  const extraArgs: string[] = stringfiedArgs.slice(1, -1).split(",")

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
