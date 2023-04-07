import { BigNumber } from "ethers"

export interface SwapService {
  provider: BigNumber
  router: string
}
