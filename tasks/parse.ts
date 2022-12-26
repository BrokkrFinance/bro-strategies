import { readLiveConfig } from "../scripts/helper/files"
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
const REGEX_GET_SUBSTRING_WITHIN_BRACKET: RegExp = /(?<=\[)(.*?)(?=\])/g // "[0, 1], [2, 3], [4]" -> ["0, 1", "2, 3", "4"]
const REGEX_TOKENIZE_BY_BRACKET: RegExp = /,(?![^[]*\])/g // "0, 1, [2, 3], 4" -> ["0", "1", "[2, 3]", "4"]

export function parseInvestmentTokenArgs(taskArgs: any): InvestmentTokenArgs {
  return {
    name: taskArgs.investmentTokenName,
    symbol: taskArgs.investmentTokenSymbol,
  }
}

export function parsePortfolioArgs(taskArgs: any): PortfolioArgs {
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

export function parsePortfolioExtraArgs(stringfiedArgs: string): PortfolioExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

export function parseStrategyArgs(taskArgs: any): StrategyArgs {
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

export function parseStrategyExtraArgs(stringfiedArgs: string): StrategyExtraArgs {
  return {
    extraArgs: parseExtraArgs(stringfiedArgs),
  }
}

export function parseStrategyLibraries(
  stringfiedLibraryNames: string,
  stringfiedLibraryDependencies: string
): StrategyLibraries {
  return {
    libraries: parseLibraries(stringfiedLibraryNames, stringfiedLibraryDependencies),
  }
}

export function parseParams(stringfiedKeys: string, stringfiedValues: string): NameValuePair[] {
  if (stringfiedKeys === "[]" && stringfiedValues === "[]") {
    return []
  }

  const keys: string[] = stringfiedKeys.slice(1, -1).split(",")
  const values: string[] = stringfiedValues.slice(1, -1).split(",")

  if (keys.length != values.length) {
    console.log("Parse: Fee params must have the same length of keys and values.")
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

export function parseExtraArgs(stringfiedArgs: string): any[] {
  if (stringfiedArgs === "[]") {
    return []
  }

  let extraArgs: any[]
  let isNested: boolean

  if (stringfiedArgs.startsWith("[[") === true && stringfiedArgs.endsWith("]]") === true) {
    extraArgs = stringfiedArgs.slice(2, -2).split(REGEX_TOKENIZE_BY_BRACKET)
    isNested = true
  } else {
    extraArgs = stringfiedArgs.slice(1, -1).split(REGEX_TOKENIZE_BY_BRACKET)
    isNested = false
  }

  for (let i = 0; i < extraArgs.length; i++) {
    if (extraArgs[i].startsWith("[") && extraArgs[i].endsWith("]")) {
      extraArgs[i] = extraArgs[i]
        .slice(1, -1)
        .split(",")
        .map((arg: string): string | number => {
          return isDecimal(arg) ? Number(arg) : arg
        })
    }
  }

  return isNested ? [extraArgs] : extraArgs
}

export function parseInvestables(stringfiedInvestables: string): string[] {
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

export function parseAllocations(stringfiedAllocations: string): number[][] {
  if (stringfiedAllocations === "[]") {
    return []
  }

  const allocations = stringfiedAllocations
    .slice(1, -1)
    .match(REGEX_GET_SUBSTRING_WITHIN_BRACKET)!
    .map((allocations: string): number[] => {
      return allocations.split(",").map((allocation: string): number => Number(allocation))
    })

  return allocations
}

export function parseRoleToUsers(stringfiedRoles: string, stringfiedUsers: string): RoleToUsers[] {
  if (stringfiedRoles === "[]" && stringfiedUsers === "[]") {
    return []
  }

  const roles: string[] = stringfiedRoles.slice(1, -1).split(",")
  const users = stringfiedUsers
    .slice(1, -1)
    .match(REGEX_GET_SUBSTRING_WITHIN_BRACKET)!
    .map((users: string): string[] => {
      return users.split(",")
    })

  if (roles.length != users.length) {
    console.log("Parse: RoleToUsers must have the same length of roles and users.")
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

export function parseLibraries(stringfiedLibraryNames: string, stringfiedLibraryDependencies: string): Library[] {
  if (stringfiedLibraryNames === "[]" && stringfiedLibraryDependencies === "[]") {
    return []
  }

  const names: string[] = stringfiedLibraryNames.slice(1, -1).split(",")
  const dependencies = stringfiedLibraryDependencies
    .slice(1, -1)
    .match(REGEX_GET_SUBSTRING_WITHIN_BRACKET)!
    .map((dependency: string): string[] => {
      return dependency.split(",")
    })

  if (names.length != dependencies.length) {
    console.log("Parse: Library must have the same length of names and dependencies.")
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

function isDecimal(arg: any): boolean {
  return !Number.isNaN(Number(arg)) && Number(arg).toString(10) === arg
}
