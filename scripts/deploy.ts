import { Contract } from "ethers"
import { ethers } from "hardhat"
import {
  ContractAddrs,
  contractAt,
  deployPortfolio,
  deployPriceOracle,
  deployUpgradeableStrategy,
  getUsdcContract,
  retryUntilSuccess,
} from "./helper"

import deploymentConfig from "../configs/deploymentConfig.json"

let priceOracle: Contract
let usdc: Contract

async function deployRecursive(investable: any): Promise<any> {
  if (investable.type === "strategy") {
    // deploy strategy
    const strategy = await retryUntilSuccess(
      deployUpgradeableStrategy(
        investable.contractName,
        investable.investmentTokenName,
        investable.investmentTokenTicker,
        usdc,
        investable.depositFee,
        investable.depositFeeParams,
        investable.withdrawalFee,
        investable.withdrawalFeeParams,
        investable.performanceFee,
        investable.performanceFeeParams,
        investable.feeReceiver,
        investable.feeReceiverParams,
        BigInt(investable.totalInvestmentLimit),
        BigInt(investable.investmentLimitPerAddress),
        priceOracle.address,
        investable.swapServiceProvider,
        investable.swapServiceRouter,
        [],
        investable.strategyExtraArgs
      )
    )
    await retryUntilSuccess(strategy.transferOwnership(investable.transferOwnershipTo))
    console.log(`Strategy successfully deployed ${investable.contractName} with ${investable.investmentTokenName}`)
    return strategy
  } else if (investable.type === "alreadyDeployedInvestable") {
    console.log(`Getting an already deployed Investable`)
    return await contractAt(investable.contractName, investable.contractAddress)
  } else if (investable.type === "portfolio") {
    const deployedInvestables = []
    for (const index in investable.investables) {
      // deploy recursively the strats/portfolios
      deployedInvestables.push(await deployRecursive(investable.investables[index]))
    }
    // then -> deploy portfolio
    const portfolio = await retryUntilSuccess(
      deployPortfolio(
        true,
        investable.contractName,
        investable.investmentTokenName,
        investable.investmentTokenTicker,
        usdc,
        deployedInvestables, // investables (strategies / portfolios of this portfolio)
        investable.depositFee,
        investable.depositFeeParams,
        investable.withdrawalFee,
        investable.withdrawalFeeParams,
        investable.performanceFee,
        investable.performanceFeeParams,
        investable.feeReceiver,
        investable.feeReceiverParams,
        BigInt(investable.totalInvestmentLimit),
        BigInt(investable.investmentLimitPerAddress),
        investable.allocations // allocations
      )
    )
    await retryUntilSuccess(portfolio.transferOwnership(investable.transferOwnershipTo))
    console.log(`Portfolio successfully deployed ${investable.contractName} with ${investable.investmentTokenName}`)
    return portfolio
  } else {
    console.error("Wrong investable type. Neither portfolio nor strategy")
  }
}

async function main() {
  console.log(process.argv.slice(2))
  usdc = await getUsdcContract()
  priceOracle = await retryUntilSuccess(deployPriceOracle(ContractAddrs.aaveOracle, usdc.address))

  const topLevelPortfolio = await deployRecursive(deploymentConfig)
  const topLevelPortfolioToken = await contractAt("InvestmentToken", await topLevelPortfolio.getInvestmentToken())
  console.log(`Calm portfolio address: ${topLevelPortfolio.address}`)
  console.log(`Calm portfolio token address: ${topLevelPortfolioToken.address}`)

  const accounts = await ethers.getSigners()
  const Alice = accounts[1]
  console.log(`Alice address: ${Alice.address}`)

  console.log(`topLevelPortfolioToken address: ${topLevelPortfolioToken.address}`)
  console.log(`topLevelPortfolio address: ${topLevelPortfolio.address}`)

  await usdc.connect(Alice).approve(topLevelPortfolio.address, "2000000")
  console.log(`after approving deposit`)
  await topLevelPortfolio.connect(Alice).deposit("2000000", Alice.address, [])
  console.log("Alice investing 2 usdc into the portfolio", usdc.address, topLevelPortfolio.address)
  await topLevelPortfolioToken.connect(Alice).approve(topLevelPortfolio.address, "1000000")
  console.log(`after approving withdrawal`)
  await topLevelPortfolio.connect(Alice).withdraw("1000000", Alice.address, [])

  console.log(`Alice successfully withdrew 1 Portfolio token`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
