import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract, ContractFactory } from "ethers"
import path from "path"
import { LiveConfig, UpgradeConfig } from "../interfaces/configs"
import {
  InvestmentTokenArgs,
  PortfolioArgs,
  PortfolioExtraArgs,
  StrategyArgs,
  StrategyLibraries,
  StrategyExtraArgs,
} from "../interfaces/parameters"
import { readLiveConfig, readUpgradeConfig } from "./paths"

export async function deployUUPSUpgradeablePortfolio(
  portfolioName: string,
  portfolioOwner: string,
  portfolioTokenArgs: InvestmentTokenArgs,
  portfolioArgs: PortfolioArgs,
  portfolioExtraArgs: PortfolioExtraArgs,
  investables: string[],
  allocations: number[][]
): Promise<Contract> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

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
  strategyLibraries: StrategyLibraries = {
    libraries: [],
  }
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
  strategyLibraries: StrategyLibraries = {
    libraries: [],
  }
): Promise<Contract> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  // Deploy libraries.
  const libraries: { [libraryName: string]: string } = {}

  for (const strategyLibrary of strategyLibraries.libraries) {
    const Library = await ethers.getContractFactory(strategyLibrary.name)
    const library = await Library.deploy()

    libraries[strategyLibrary.name] = library.address

    // TODO: The functionality of libraries depending on other libraries is not yet supported
  }

  // Contact factories.
  const InvestmentToken = await ethers.getContractFactory("InvestmentToken")
  const PriceOracle = await ethers.getContractFactory(strategyArgs.oracle.name)
  const Strategy = await ethers.getContractFactory(strategyName, { libraries })

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

async function deployUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
  // Get an instance of HRE.
  const { upgrades } = require("hardhat")

  const contract = await upgrades.deployProxy(factory, args, {
    kind: "uups",
    unsafeAllow: ["external-library-linking"],
  })
  await contract.deployed()

  return contract
}

export async function upgradePortfolio(name: string): Promise<Contract> {
  return await upgradeInvestable(path.join("portfolio", name))
}

export async function upgradeStrategy(name: string): Promise<Contract> {
  return await upgradeInvestable(path.join("strategy", name))
}

async function upgradeInvestable(name: string): Promise<Contract> {
  // Get an instance of HRE.
  const { ethers, upgrades } = require("hardhat")

  const liveConfig: LiveConfig = readLiveConfig(name)
  const upgradeConfigs: UpgradeConfig[] = readUpgradeConfig(name)

  const owner = await ethers.getImpersonatedSigner(liveConfig.owner)

  for (let upgradeConfig of upgradeConfigs) {
    const NewImplementation = await ethers.getContractFactory(upgradeConfig.newImplementation, owner)
    const newImplementation = await upgrades.upgradeProxy(upgradeConfig.proxy, NewImplementation, {
      kind: "uups",
      unsafeSkipStorageCheck: true,
    })
    await newImplementation.deployed()
  }

  return await ethers.getContractAt(liveConfig.name, liveConfig.address)
}

export async function verifyContract(address: string): Promise<void> {
  const hre = require("hardhat")

  console.log(`Verify: Verify a contract at ${address}`)

  try {
    await hre.run("verify", { address })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Contract source code already verified") {
      console.log("Verify: The contract is already verified.")
    } else {
      console.log(`Verify: The following error occured during verificaiton.\n\n${e}`)
    }
  }
}

export async function removeInvestmentLimitsAndFees(investable: Contract, owner: SignerWithAddress): Promise<void> {
  // Get an instance of HRE.
  const { ethers } = require("hardhat")

  const isPortfolio = await investable.supportsInterface("0x2ac9cdaa")
  const isStrategy = await investable.supportsInterface("0x00000000")

  if (isPortfolio === false && isStrategy === false) {
    throw new Error("The given investable is neither portfolio nor strategy.")
  }

  if (isPortfolio === true) {
    const investables = await investable.getInvestables()

    for (let i = 0; i < investables.length; i++) {
      const investable = await ethers.getContractAt("IInvestable", await investables[i].investable)
      removeInvestmentLimitsAndFees(investable, owner)
    }
  }

  await setInvestmentLimits(investable, owner)
  await setFees(investable, owner)
}

async function setInvestmentLimits(
  investable: Contract,
  owner: SignerWithAddress,
  limit: BigInt = BigInt(1e20)
): Promise<void> {
  await investable.connect(owner).setTotalInvestmentLimit(limit)
  await investable.connect(owner).setInvestmentLimitPerAddress(limit)
}

async function setFees(investable: Contract, owner: SignerWithAddress, fee: number = 0): Promise<void> {
  await investable.connect(owner).setDepositFee(fee, [])
  await investable.connect(owner).setWithdrawalFee(fee, [])
  await investable.connect(owner).setPerformanceFee(fee, [])
}
