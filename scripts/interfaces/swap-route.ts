import { BigNumber } from "ethers"

export interface PairData {
  pair: string
  data: string
}

export interface SwapRoute {
  token0: string
  token1: string
  router: string
  dex: BigNumber
  pairData: PairData
}
