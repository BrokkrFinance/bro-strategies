import $RefParser from "@apidevtools/json-schema-ref-parser"
import { execSync } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { DeployConfig, LiveConfig, UpgradeConfig } from "../interfaces/configs"
import { Investable } from "../interfaces/investable"
import { getDeployConfigPath, getLiveConfigPath, getUpgradeConfigPath } from "./paths"

export async function readDeployConfig(investable: Investable): Promise<DeployConfig[]> {
  return (await readRefConfig(getDeployConfigPath(investable))) as DeployConfig[]
}

export function readLiveConfig(investable: Investable): LiveConfig {
  return JSON.parse(readFileSync(getLiveConfigPath(investable), { encoding: "utf-8" }))
}

export async function readUpgradeConfig(investable: Investable): Promise<UpgradeConfig[]> {
  return (await readRefConfig(getUpgradeConfigPath(investable))) as UpgradeConfig[]
}

export function writeLiveConfig(investable: Investable, liveConfig: LiveConfig): void {
  const path = getLiveConfigPath(investable)

  if (existsSync(path) === false) {
    const leafDir = path.slice(0, path.lastIndexOf("/"))

    mkdirSync(leafDir, { recursive: true })
  }

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
