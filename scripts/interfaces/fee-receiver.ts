import { NameValuePair } from "./name-value-pair"

export interface FeeReceiver {
  address: string
  params: NameValuePair[]
}
