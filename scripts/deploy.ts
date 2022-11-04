import { Contract } from "ethers"
import { ethers } from "hardhat"
import {
  ContractAddrs,
  contractAt,
  deployPortfolio,
  deployPriceOracle,
  deployUpgradeableStrategy,
  getUsdcContract,
  logRed,
  retryUntilSuccess,
} from "./helper"

import { exit } from "process"
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
        investable.strategyExtraArgs,
        {}
      )
    )

    await retryUntilSuccess(strategy.transferOwnership(investable.transferOwnershipTo))
    logRed(
      `Strategy '${investable.contractName}' successfully deployed with investment token name '${investable.investmentTokenName}' \n`
    )
    return strategy
  } else if (investable.type === "alreadyDeployedInvestable") {
    return await contractAt(investable.contractName, investable.contractAddress)
  } else if (investable.type === "portfolio") {
    const deployedInvestables = []
    for (const index in investable.investables) {
      // deploy recursively the strats/portfolios
      deployedInvestables.push(await deployRecursive(investable.investables[index]))
    }
    // deploy portfolio
    const portfolio = await retryUntilSuccess(
      deployPortfolio(
        true,
        investable.contractName,
        investable.investmentTokenName,
        investable.investmentTokenTicker,
        usdc,
        deployedInvestables,
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
        investable.allocations
      )
    )

    await retryUntilSuccess(portfolio.transferOwnership(investable.transferOwnershipTo))
    logRed(
      `Portfolio '${investable.contractName}' successfully deployed with investment token name '${investable.investmentTokenName}' \n`
    )
    return portfolio
  } else {
    console.error("Wrong investable type. Neither portfolio nor strategy")
    exit(1)
  }
}

async function main() {
  console.log(process.argv.slice(2))
  usdc = await getUsdcContract()
  priceOracle = await retryUntilSuccess(deployPriceOracle("AaveOracle", ContractAddrs.aaveOracle, usdc.address))

  const topLevelPortfolio = await deployRecursive(deploymentConfig)
  const topLevelPortfolioToken = await contractAt("InvestmentToken", await topLevelPortfolio.getInvestmentToken())

  // testing the deployed portfolio and leaving 1 USDC permanently invested in the strategy
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  await usdc.approve(topLevelPortfolio.address, "2000000")
  console.log(`after approving deposit`)
  await topLevelPortfolio.deposit("2000000", "0", deployer.address, [])
  console.log("Alice investing 2 usdc into the portfolio", usdc.address, topLevelPortfolio.address)
  await topLevelPortfolioToken.approve(topLevelPortfolio.address, "1000000")
  console.log(`after approving withdrawal`)
  await topLevelPortfolio.withdraw("1000000", "0", deployer.address, [])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
