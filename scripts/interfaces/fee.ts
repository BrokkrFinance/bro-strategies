import { NameValuePair } from "./name-value-pair"

export interface Fee {
  amount: number
  params: NameValuePair[]
}
