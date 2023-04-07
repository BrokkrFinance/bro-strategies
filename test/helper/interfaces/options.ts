import { Network } from "./network"

export interface PortfolioTestOptions {
  network: Network
  upgradeTo: string
}

export interface StrategyTestOptions {
  network: Network
  upgradeTo: string
  runReapReward?: boolean
  runReapRewardExtra?: boolean
  runReapUninvestedReward?: boolean
}

export interface IndexTestOptions {
  network: Network
}
