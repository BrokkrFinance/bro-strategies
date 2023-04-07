import path from "path"
import { Investable } from "../interfaces/investable"

const ConfigDir = "./configs"
const DeployDir = "./deploy"
const LiveDir = "./live"
const UpgradeDir = "./upgrade"

export function getDeployConfigPath(investable: Investable): string {
  return path.resolve(path.join(ConfigDir, investable.network, DeployDir, investable.type, investable.name + ".json"))
}

export function getLiveConfigPath(investable: Investable): string {
  return path.resolve(path.join(ConfigDir, investable.network, LiveDir, investable.type, investable.name + ".json"))
}

export function getUpgradeConfigPath(investable: Investable): string {
  return path.resolve(path.join(ConfigDir, investable.network, UpgradeDir, investable.type, investable.name + ".json"))
}
