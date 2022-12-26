import path from "path"

const DeployConfigDir = "./configs/deploy"
const LiveConfigDir = "./configs/live"
const UpgradeConfigDir = "./configs/upgrade"

export function getDeployConfigPath(name: string): string {
  return path.resolve(path.join(DeployConfigDir, name + ".json"))
}

export function getLiveConfigPath(name: string): string {
  return path.resolve(path.join(LiveConfigDir, name + ".json"))
}

export function getUpgradeConfigPath(name: string): string {
  return path.resolve(path.join(UpgradeConfigDir, name + ".json"))
}
