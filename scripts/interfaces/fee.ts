import { BigNumber } from "ethers"
import { NameValuePair } from "./name-value-pair"

export interface Fee {
  amount: BigNumber
  params: NameValuePair[]
}
