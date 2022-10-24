import { BigNumber } from "ethers"
import { Oracle } from "./oracles"
import { SwapService } from "./swaps"

export interface NameValuePair {
  key: string
  value: string
}

export interface Fee {
  amount: number
  params: NameValuePair[]
}

export interface FeeReceiver {
  address: string
  params: NameValuePair[]
}

export interface InvestmentLimit {
  total: BigInt
  perAddress: BigInt
}

export interface RoleToUsers {
  role: string
  users: string[]
}

export interface StrategyArgs {
  depositFee: Fee
  withdrawalFee: Fee
  performanceFee: Fee
  feeReceiver: FeeReceiver
  investmentLimit: InvestmentLimit
  oracle: Oracle
  swapService: SwapService
  roleToUsers: RoleToUsers[]
}

export interface StrategyExtraArgs {
  extraArgs: any[]
}

export interface PortfolioArgs {
  depositFee: Fee
  withdrawalFee: Fee
  performanceFee: Fee
  feeReceiver: FeeReceiver
  investmentLimit: InvestmentLimit
}

export interface PortfolioExtraArgs {
  extraArgs: any[]
}

export interface DepositArgs {
  amount: BigNumber
  investmentTokenReceiver: string
  params: any[]
}
