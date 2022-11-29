export interface LiveConfig {
  name: string
  address: string
  owner: string
}

export interface UpgradeConfig {
  proxy: string
  newImplementation: string
  functionName?: string
  functionArgs?: any[]
}
