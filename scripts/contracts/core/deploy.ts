import { Contract, ContractFactory } from "ethers"
import { ethers, upgrades } from "hardhat"
import {
  IndexArgs,
  IndexExtraArgs,
  IndexTokenArgs,
  InvestmentTokenArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyExtraArgs,
} from "../../interfaces/parameters"
import { Libraries } from "../../types/library"

export async function deployUUPSUpgradeablePortfolio(
  portfolioName: string,
  portfolioOwner: string,
  portfolioTokenArgs: InvestmentTokenArgs,
  portfolioArgs: PortfolioArgs,
  portfolioExtraArgs: PortfolioExtraArgs,
  investables: string[],
  allocations: number[][]
): Promise<Contract> {
  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const Portfolio = await ethers.getContractFactory(portfolioName)

  // Deploy portfolio token.
  const investmentToken = await deployUUPSUpgradeableContract(InvestmentToken, [
    portfolioTokenArgs.name,
    portfolioTokenArgs.symbol,
  ])

  // Deploy portfolio.
  const portfolio = await deployUUPSUpgradeableContract(Portfolio, [
    [
      investmentToken.address,
      portfolioArgs.depositToken,
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
    await portfolio.addInvestable(investables[i], allocations[i], [])
  }

  // Transfer ownership of portfolio token to portfolio.
  await investmentToken.transferOwnership(portfolio.address)

  if (ethers.utils.isAddress(portfolioOwner)) {
    // Transfer ownership of portfolio to portfolio owner.
    await portfolio.transferOwnership(portfolioOwner)
  }

  return portfolio
}

export async function deployUUPSUpgradeableStrategyOwnable(
  strategyName: string,
  strategyOwner: string,
  strategyTokenArgs: InvestmentTokenArgs,
  strategyArgs: StrategyArgs,
  strategyExtraArgs: StrategyExtraArgs,
  strategyLibraries: Libraries = {}
): Promise<Contract> {
  const strategy = await deployUUPSUpgradeableStrategy(
    strategyName,
    strategyTokenArgs,
    strategyArgs,
    strategyExtraArgs,
    strategyLibraries
  )

  // Transfer ownership of strategy to strategy owner.
  await strategy.transferOwnership(strategyOwner)

  return strategy
}

export const deployUUPSUpgradeableStrategyRoleable = deployUUPSUpgradeableStrategy

async function deployUUPSUpgradeableStrategy(
  strategyName: string,
  strategyTokenArgs: InvestmentTokenArgs,
  strategyArgs: StrategyArgs,
  strategyExtraArgs: StrategyExtraArgs,
  strategyLibraries: Libraries = {}
): Promise<Contract> {
  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const PriceOracle = await ethers.getContractFactory(strategyArgs.oracle.name)
  const Strategy = await ethers.getContractFactory(strategyName, { libraries: strategyLibraries })

  // Deploy strategy token.
  const investmentToken = await deployUUPSUpgradeableContract(InvestmentToken, [
    strategyTokenArgs.name,
    strategyTokenArgs.symbol,
  ])

  // Deploy price oracle.
  const priceOracle = await deployUUPSUpgradeableContract(PriceOracle, [
    strategyArgs.oracle.address,
    strategyArgs.depositToken,
  ])

  // Deploy strategy.
  const strategy = await deployUUPSUpgradeableContract(Strategy, [
    [
      investmentToken.address,
      strategyArgs.depositToken,
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

export async function deployUUPSUpgradeableIndexOwnable(
  indexName: string,
  indexOwner: string,
  indexTokenArgs: IndexTokenArgs,
  indexArgs: IndexArgs,
  indexExtraArgs: IndexExtraArgs,
  indexLibraries: Libraries = {}
): Promise<Contract> {
  const index = await deployUUPSUpgradeableIndex(indexName, indexTokenArgs, indexArgs, indexExtraArgs, indexLibraries)

  // Transfer ownership of index to index owner.
  await index.transferOwnership(indexOwner)

  return index
}

async function deployUUPSUpgradeableIndex(
  indexName: string,
  indexTokenArgs: IndexTokenArgs,
  indexArgs: IndexArgs,
  indexExtraArgs: IndexExtraArgs,
  indexLibraries: Libraries = {}
): Promise<Contract> {
  // Contact factories.
  const IndexToken = await ethers.getContractFactory("IndexToken")
  const IndexStrategy = await ethers.getContractFactory(indexName, { libraries: indexLibraries })

  // Deploy index token.
  const indexToken = await deployUUPSUpgradeableContract(IndexToken, [indexTokenArgs.name, indexTokenArgs.symbol])

  // Deploy index.
  const index = await deployUUPSUpgradeableContract(IndexStrategy, [
    [
      indexArgs.wNATIVE,
      indexToken.address,
      indexArgs.components,
      indexArgs.swapRoutes,
      indexArgs.whitelistedTokens,
      indexArgs.oracle.address,
      indexArgs.equityValuationLimit,
    ],
    ...indexExtraArgs.extraArgs,
  ])

  // Transfer ownership of strategy token to strategy.
  await indexToken.transferOwnership(index.address)

  return index
}

export async function deployUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
  // Deploy investable.
  const contract = await upgrades.deployProxy(factory, args, {
    kind: "uups",
    unsafeAllow: ["external-library-linking"],
  })
  await contract.deployed()

  return contract
}
