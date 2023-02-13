import { Contract } from "ethers"
import { Investable } from "../../interfaces/investable"
import { upgrade } from "../execution/upgrade"

export async function upgradePortfolio(network: string, name: string): Promise<Contract> {
  return await upgradeInvestable({
    network: network,
    type: "portfolio",
    name: name,
  })
}

export async function upgradeStrategy(network: string, name: string): Promise<Contract> {
  return await upgradeInvestable({
    network: network,
    type: "strategy",
    name: name,
  })
}

async function upgradeInvestable(investable: Investable): Promise<Contract> {
  return await upgrade(investable, { forkEnabled: true })
}
