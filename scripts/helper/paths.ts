import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { LiveConfig, UpgradeConfig } from "../interfaces/configs"

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

export function readLiveConfig(name: string): LiveConfig {
  return JSON.parse(readFileSync(getLiveConfigPath(name), { encoding: "utf-8" }))
}

export function readUpgradeConfig(name: string): UpgradeConfig[] {
  return JSON.parse(readFileSync(getUpgradeConfigPath(name), { encoding: "utf-8" }))
}

export function writeLiveConfig(name: string, liveConfig: LiveConfig): void {
  const path = getLiveConfigPath(name)

  writeFileSync(path, JSON.stringify(liveConfig), {
    encoding: "utf-8",
  })
  execSync(`npx prettier --write '${path}'`)
}
