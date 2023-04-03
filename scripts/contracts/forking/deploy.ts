import { Contract } from "ethers"
import { Investable } from "../../interfaces/investable"
import { deploy } from "../execution/deploy"

export async function deployPortfolio(network: string, name: string): Promise<Contract> {
  return await deployInvestable({
    network: network,
    type: "portfolio",
    name: name,
  })
}

export async function deployStrategy(network: string, name: string): Promise<Contract> {
  return await deployInvestable({
    network: network,
    type: "strategy",
    name: name,
  })
}

async function deployInvestable(investable: Investable): Promise<Contract> {
  return await deploy(investable, { forkEnabled: true })
}
