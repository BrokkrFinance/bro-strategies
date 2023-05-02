export interface IMapString {
  [details: string]: string
}

export interface Chain {
  name: string
  url: string
  chainId: number
  forkAt: number
  whaleAddrs: IMapString
}
