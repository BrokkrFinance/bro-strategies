import { BigNumber } from "ethers"
import { Fee } from "./fee"
import { FeeReceiver } from "./fee-receiver"
import { InvestmentLimit } from "./investment-limit"
import { Library } from "./library"
import { Oracle } from "./oracle"
import { RoleToUsers } from "./role-to-users"
import { SwapService } from "./swap-service"

export interface StrategyArgs {
  depositToken: string
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

export interface StrategyLibraries {
  libraries: Library[]
}

export interface PortfolioArgs {
  depositToken: string
  depositFee: Fee
  withdrawalFee: Fee
  performanceFee: Fee
  feeReceiver: FeeReceiver
  investmentLimit: InvestmentLimit
}

export interface PortfolioExtraArgs {
  extraArgs: any[]
}

export interface InvestmentTokenArgs {
  name: string
  symbol: string
}

export interface InvestArgs {
  amount: BigNumber
  minimumDepositTokenAmountOut: BigNumber
  tokenReceiver: string
  params: any[]
}

export interface DepositArgs {
  amount: BigNumber
  minimumDepositTokenAmountOut: BigNumber
  investmentTokenReceiver: string
  params: any[]
}

export interface WithdrawArgs {
  amount: BigNumber
  minimumDepositTokenAmountOut: BigNumber
  depositTokenReceiver: string
  params: any[]
}
