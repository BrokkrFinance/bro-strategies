import { Network } from "./network"

export interface PortfolioTestOptions {
  network: Network
  forkAt: number
  upgradeTo: string
}

export interface StrategyTestOptions {
  network: Network
  forkAt: number
  upgradeTo: string
  runReapReward?: boolean
  runReapRewardExtra?: boolean
  runReapUninvestedReward?: boolean
}

export interface IndexTestOptions {
  network: Network
  forkAt: number
  upgradeTo: string
  runRebalance?: boolean
}
