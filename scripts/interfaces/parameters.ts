import { BigNumber } from "ethers"
import { Component } from "./component"
import { Fee } from "./fee"
import { FeeReceiver } from "./fee-receiver"
import { InvestmentLimit } from "./investment-limit"
import { Library } from "./library"
import { Oracle } from "./oracle"
import { RoleToUsers } from "./role-to-users"
import { SwapRoute } from "./swap-route"
import { SwapService } from "./swap-service"

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
export interface LibraryArgs {
  libraries: Library[]
}

export interface PortfolioArgs {
  depositToken: string
  feeArgs: {
    depositFee: Fee
    withdrawalFee: Fee
    performanceFee: Fee
    managementFee: Fee
    feeReceiver: FeeReceiver
  }
  investmentLimit: InvestmentLimit
}

export interface PortfolioExtraArgs {
  extraArgs: any[]
}

export interface StrategyArgs {
  depositToken: string
  feeArgs: {
    depositFee: Fee
    withdrawalFee: Fee
    performanceFee: Fee
    managementFee: Fee
    feeReceiver: FeeReceiver
  }
  investmentLimit: InvestmentLimit
  oracle: Oracle
  swapService: SwapService
  roleToUsers: RoleToUsers[]
}

export interface StrategyExtraArgs {
  extraArgs: any[]
}

export interface IndexTokenArgs {
  name: string
  symbol: string
}

export interface IndexArgs {
  wNATIVE: string
  components: Component[]
  swapRoutes: SwapRoute[]
  whitelistedTokens: string[]
  oracle: Oracle
  equityValuationLimit: BigNumber
}

export interface IndexExtraArgs {
  extraArgs: any[]
}
