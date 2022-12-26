import $RefParser from "@apidevtools/json-schema-ref-parser"
import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { DeployConfig, LiveConfig, UpgradeConfig } from "../interfaces/configs"
import { getDeployConfigPath, getLiveConfigPath, getUpgradeConfigPath } from "./paths"

export async function readDeployConfig(name: string): Promise<DeployConfig[]> {
  return (await readRefConfig(getDeployConfigPath(name))) as DeployConfig[]
}

export function readLiveConfig(name: string): LiveConfig {
  return JSON.parse(readFileSync(getLiveConfigPath(name), { encoding: "utf-8" }))
}

export async function readUpgradeConfig(name: string): Promise<UpgradeConfig[]> {
  return (await readRefConfig(getUpgradeConfigPath(name))) as UpgradeConfig[]
}

export function writeLiveConfig(name: string, liveConfig: LiveConfig): void {
  const path = getLiveConfigPath(name)

  writeFileSync(path, JSON.stringify(liveConfig), {
    encoding: "utf-8",
  })

  execSync(`npx prettier --write '${path}'`)
}

async function readRefConfig(path: string): Promise<DeployConfig[] | UpgradeConfig[]> {
  const configSchema = await $RefParser.dereference(path)

  if (configSchema.properties === undefined) {
    console.log("Files: Wrong config file. The config file must have 'properties' key.")
    throw new Error("Wrong config file")
  }

  const config: DeployConfig[] | UpgradeConfig[] = JSON.parse(JSON.stringify(configSchema.properties))

  return config
}
