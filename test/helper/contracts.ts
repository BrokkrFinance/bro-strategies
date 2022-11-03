import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract, ContractFactory } from "ethers"
import { readFileSync } from "fs"
import { ethers, upgrades } from "hardhat"
import path from "path"
import { UpgradeConfig } from "../../scripts/upgrade"
import erc20Abi from "./abi/erc20.json"
import investableAbi from "./abi/investable.json"
import { TokenAddrs } from "./addresses"
import { PortfolioArgs, PortfolioExtraArgs, StrategyArgs, StrategyExtraArgs } from "./parameters"

export interface LiveConfig {
  name: string
  address: string
  owner: string
}

export async function getTokenContract(address: string) {
  return await ethers.getContractAt(erc20Abi, address)
}

export async function deployUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
  const contract = await upgrades.deployProxy(factory, args, {
    kind: "uups",
    unsafeAllow: ["external-library-linking"],
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
  strategyExtraArgs: StrategyExtraArgs,
  librariesStructs: { libraryContractName: string; libraryDependencies: string[] }[]
) {
  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const PriceOracle = await ethers.getContractFactory(strategyArgs.oracle.name)

  // Deploy strategy token.
  const investmentToken = await deployUUPSUpgradeableContract(InvestmentToken, ["InvestmentToken", "Strategy Token"])
  const priceOracle = await deployUUPSUpgradeableContract(PriceOracle, [strategyArgs.oracle.address, TokenAddrs.usdc])

  // Deploying libraries
  // The functionality of libraries depending on other libraries is not yet supported
  let libraries: any = {}
  for (const librarySturct of librariesStructs) {
    const libraryContractFactory = await ethers.getContractFactory(librarySturct.libraryContractName)
    const library = await libraryContractFactory.deploy()
    libraries[librarySturct.libraryContractName] = library.address
  }
  const Strategy = await ethers.getContractFactory(strategyName, { libraries })

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

export const upgradePortfolio = upgradeInvestable
export const upgradeStrategy = upgradeInvestable

export async function upgradeInvestable(config: string, upgradeClassName: string) {
  process.chdir(__dirname)
  const liveConfig: LiveConfig = JSON.parse(
    readFileSync(path.join("../../configs/live", config), { encoding: "utf-8" })
  )
  const upgradeConfigs: UpgradeConfig[] = JSON.parse(
    readFileSync(path.join("../../configs/upgrade", config), { encoding: "utf-8" })
  )
  process.chdir("../../")

  const owner = await ethers.getImpersonatedSigner(liveConfig.owner)
  for (let upgradeConfig of upgradeConfigs) {
    const NewImplementation = await ethers.getContractFactory(upgradeConfig.newImplementation, owner)
    const newImplementation = await upgrades.upgradeProxy(upgradeConfig.proxy, NewImplementation, {
      kind: "uups",
      // unsafeSkipStorageCheck: true,
    })
    await newImplementation.deployed()
  }

  const investable = await ethers.getContractAt(liveConfig.name, liveConfig.address)
  return { investable: investable, ownerAddr: liveConfig.owner, upgradeClassName }
}

export async function removePortfolioInvestmentLimitsAndFees(portfolio: Contract, owner: SignerWithAddress) {
  const limit = BigInt(1e20)
  const fee = 0

  await setInvestableInvestmentLimits(portfolio, owner, limit)
  await setInvestableFees(portfolio, owner, fee)

  const investables = await portfolio.getInvestables()
  for (let i = 0; i < investables.length; i++) {
    const investable = await ethers.getContractAt(investableAbi, await investables[i].investable)
    await setInvestableInvestmentLimits(investable, owner, limit)
    await setInvestableFees(investable, owner, fee)
  }
}

export async function removeStrategyInvestmentLimitsAndFees(strategy: Contract, owner: SignerWithAddress) {
  const limit = BigInt(1e20)
  const fee = 0

  await setInvestableInvestmentLimits(strategy, owner, limit)
  await setInvestableFees(strategy, owner, fee)
}

export async function setInvestableInvestmentLimits(investable: Contract, owner: SignerWithAddress, limit: BigInt) {
  await investable.connect(owner).setTotalInvestmentLimit(limit)
  await investable.connect(owner).setInvestmentLimitPerAddress(limit)
}

export async function setInvestableFees(investable: Contract, owner: SignerWithAddress, fee: number) {
  await investable.connect(owner).setDepositFee(fee, [])
  await investable.connect(owner).setWithdrawalFee(fee, [])
  await investable.connect(owner).setPerformanceFee(fee, [])
}
