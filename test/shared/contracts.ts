import { Contract, ContractFactory } from "ethers"
import { ethers, upgrades } from "hardhat"
import erc20Abi from "./abi/erc20.json"

export async function getTokenContract(address: string) {
  return await ethers.getContractAt(erc20Abi, address)
}

export async function getUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
  const contract = await upgrades.deployProxy(factory, args, {
    kind: "uups",
  })
  await contract.deployed()

  return contract
}

export async function getUUPSUpgradeableStrategy(
  factory: ContractFactory,
  args: any[],
  strategyToken: Contract
): Promise<Contract> {
  const strategy = await getUUPSUpgradeableContract(factory, args)

  await strategyToken.transferOwnership(strategy.address)

  return strategy
}

export async function getUUPSUpgradeablePortfolio(
  factory: ContractFactory,
  args: any[],
  portfolioToken: Contract,
  investables: Contract[],
  allocations: number[][]
): Promise<Contract> {
  const portfolio = await getUUPSUpgradeableContract(factory, args)

  await portfolioToken.transferOwnership(portfolio.address)

  for (let i = 0; i < investables.length; i++) {
    await portfolio.addInvestable(investables[i].address, allocations[i], [])
  }

  return portfolio
}
