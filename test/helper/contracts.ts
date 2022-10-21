import { Contract, ContractFactory } from "ethers"
import { ethers, upgrades } from "hardhat"
import erc20Abi from "./abi/erc20.json"
import { TokenAddrs } from "./addresses"
import { PortfolioArgs, PortfolioExtraArgs, StrategyArgs, StrategyExtraArgs } from "./parameters"

export async function getTokenContract(address: string) {
  return await ethers.getContractAt(erc20Abi, address)
}

export async function deployUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
  const contract = await upgrades.deployProxy(factory, args, {
    kind: "uups",
  })
  await contract.deployed()

  return contract
}

export async function deployUUPSUpgradeablePortfolio(
  portfolioName: string,
  portfolioArgs: PortfolioArgs,
  portfolioExtraArgs: PortfolioExtraArgs,
  investables: Contract[],
  allocations: number[][]
) {
  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const Portfolio = await ethers.getContractFactory(portfolioName)

  // Deploy portfolio token.
  const investmentToken = await deployUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "Portfolio Token"])

  // Deploy portfolio.
  const portfolio = await deployUUPSUpgradeableContract(Portfolio, [
    [
      investmentToken.address,
      TokenAddrs.usdc,
      portfolioArgs.depositFee.amount,
      portfolioArgs.depositFee.params,
      portfolioArgs.withdrawalFee.amount,
      portfolioArgs.withdrawalFee.params,
      portfolioArgs.performanceFee.amount,
      portfolioArgs.performanceFee.params,
      portfolioArgs.feeReceiver.address,
      portfolioArgs.feeReceiver.params,
      portfolioArgs.investmentLimit.total,
      portfolioArgs.investmentLimit.perAddress,
    ],
    ...portfolioExtraArgs.extraArgs,
  ])

  // Add investables.
  for (let i = 0; i < investables.length; i++) {
    await portfolio.addInvestable(investables[i].address, allocations[i], [])
  }

  // Transfer ownership of portfolio token to portfolio.
  await investmentToken.transferOwnership(portfolio.address)

  return portfolio
}

export async function deployUUPSUpgradeableStrategy(
  strategyName: string,
  strategyArgs: StrategyArgs,
  strategyExtraArgs: StrategyExtraArgs
) {
  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const PriceOracle = await ethers.getContractFactory(strategyArgs.oracle.name)
  const Strategy = await ethers.getContractFactory(strategyName)

  // Deploy strategy token.
  const investmentToken = await deployUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "Strategy Token"])
  const priceOracle = await deployUUPSUpgradeableContract(PriceOracle, [strategyArgs.oracle.address, TokenAddrs.usdc])

  // Deploy strategy.
  const strategy = await deployUUPSUpgradeableContract(Strategy, [
    [
      investmentToken.address,
      TokenAddrs.usdc,
      strategyArgs.depositFee.amount,
      strategyArgs.depositFee.params,
      strategyArgs.withdrawalFee.amount,
      strategyArgs.withdrawalFee.params,
      strategyArgs.performanceFee.amount,
      strategyArgs.performanceFee.params,
      strategyArgs.feeReceiver.address,
      strategyArgs.feeReceiver.params,
      strategyArgs.investmentLimit.total,
      strategyArgs.investmentLimit.perAddress,
      priceOracle.address,
      strategyArgs.swapService.provider,
      strategyArgs.swapService.router,
      strategyArgs.roleToUsers,
    ],
    ...strategyExtraArgs.extraArgs,
  ])

  // Transfer ownership of strategy token to strategy.
  await investmentToken.transferOwnership(strategy.address)

  return strategy
}
