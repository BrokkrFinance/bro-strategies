import { ethers } from "hardhat"
import { BigNumber, Contract } from "ethers"
import {
  ContractAddrs,
  contractAt,
  deployPriceOracle,
  deployUpgradeableStrategy,
  deployPortfolio,
  expectSuccess,
  getUsdcContract,
} from "./helper"

import deploymentConfig from "./deploymentConfig.json"

let priceOracle: Contract

async function deployRecursive(investable: any): Promise<any> {
  if (investable.type === "strategy") {
    // deploy strategy
    const strategy = await expectSuccess(
      deployUpgradeableStrategy(
        investable.contractName,
        investable.investmentTokenName,
        investable.investmentTokenTicker,
        await expectSuccess(getUsdcContract()),
        0, // depositFee
        [], // depositFeeParams
        0, // withdrawalFee
        [], // withdrawalFeeParams
        0, // performanceFee
        [], // performanceFeeParams
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772", // feeReceiver
        [], // feeReceiverParams
        BigInt(10 ** 20), // totalInvestmentLimit
        BigInt(10 ** 20), // investmentLimitPerAddress
        priceOracle.address, // price oracle
        0,
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", // TraderJoe Router v2
        investable.strategyExtraArgs
      )
    )
    return strategy
  } else if (investable.type === "portfolio") {
    let deployedInvestables = []
    for (const index in investable.investables) {
      // deploy recursively the strats/portfolios
      deployedInvestables.push(await deployRecursive(investable.investables[index]))
    }
    // then -> deploy portfolio
    const portfolio = await expectSuccess(
      deployPortfolio(
        investable.contractName,
        investable.investmentTokenName,
        investable.investmentTokenTicker,
        await expectSuccess(getUsdcContract()),
        deployedInvestables, // investables (strategies / portfolios of this portfolio)
        0, // depositFee
        [], // depositFeeParams
        5, // withdrawalFee
        [], // withdrawalFeeParams
        0, // performanceFee
        [], // performanceFeeParams
        "0x3f19dC970eF894c57aE4c8b09F842823b3d79772", // feeReceiver
        [], // feeReceiverParams
        BigInt(10 ** 20), // totalInvestmentLimit
        BigInt(10 ** 20), // investmentLimitPerAddress
        investable.allocations // allocations
      )
    )
    return portfolio
  } else {
    console.error("wrong investable type. Neither portfolio nor strategy")
  }
}

describe("Stargate Strategy", function () {
  let usdc: Contract
  let topLevelPortfolio: Contract
  let topLevelPortfolioToken: Contract

  before(async function () {
    usdc = await expectSuccess(getUsdcContract())
    priceOracle = await expectSuccess(deployPriceOracle(ContractAddrs.aaveOracle, (await getUsdcContract()).address))

    topLevelPortfolio = await deployRecursive(deploymentConfig)
    topLevelPortfolioToken = await contractAt("InvestmentToken", await topLevelPortfolio.getInvestmentToken())
    console.log(`Calm portfolio address: ${topLevelPortfolio.address}`)
    console.log(`Calm portfolio token address: ${topLevelPortfolioToken.address}`)
  })

  it("Smoke test", async function () {
    const accounts = await ethers.getSigners()
    const Alice = accounts[1]
    console.log(`Alice address: ${Alice.address}`)

    console.log(`portfolioToken address: ${topLevelPortfolioToken.address}`)
    console.log(`topLevelPortfolio address: ${topLevelPortfolio.address}`)

    await usdc.connect(Alice).approve(topLevelPortfolio.address, "2000000")
    console.log(`after approving`)
    await new Promise((f) => setTimeout(f, 5000))
    await topLevelPortfolio.connect(Alice).deposit("2000000", Alice.address, [])
    await new Promise((f) => setTimeout(f, 5000))
    console.log("Alice investing 2 usdc into the portfolio", usdc.address, topLevelPortfolio.address)
    await topLevelPortfolioToken.connect(Alice).approve(topLevelPortfolio.address, "1000000")
    await new Promise((f) => setTimeout(f, 5000))
    await topLevelPortfolio.connect(Alice).withdraw("1000000", Alice.address, [])

    console.log(`Alice successfully withdrew 0.5 Portfolio tokens`)
  })
})
