import { Library } from "./library"

export interface DeployConfig {
  [key: string]: any
}

export interface LiveConfig {
  name: string
  address: string
  owner?: string
  multisig?: string
}

export interface UpgradeConfig {
  proxy: string
  newImplementation: string
  functionName?: string
  functionArgs?: any[]
  libraries?: Library[]
}
