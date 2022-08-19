import { config } from "chai"
import { Contract } from "ethers"
import { ethers } from "hardhat"
import {
  ContractAddrs,
  contractAt,
  deployFreeMoneyProvider,
  deployPortfolio,
  deployPriceOracle,
  deployProxyContract,
  deployStrategy,
  expectSuccess,
  getUsdcContract,
  logBlue,
  logCyan,
  logRed,
} from "./helper"
config.includeStack = true

ContractAddrs
deployFreeMoneyProvider
deployPortfolio
deployStrategy
logBlue
logCyan
logRed
contractAt
deployProxyContract
expectSuccess
getUsdcContract

function printAssetValuations(headerText: string, assetValuations: any) {
  console.log(headerText)
  for (const assetValuation of assetValuations) {
    console.log("asset: %s, amount: %i", assetValuation[0], assetValuation[1])
  }
}

async function printState(
  header: string,
  depositToken: Contract,
  portfolio: Contract,
  strategy1: Contract,
  strategy2: Contract,
  strategy3: Contract
) {
  const accounts = await ethers.getSigners()
  const Alice = accounts[1].address
  const Bob = accounts[2].address
  const Charlie = accounts[3].address

  const strategy1Token = await contractAt("InvestmentToken", await strategy1.getInvestmentToken())
  const strategy2Token = await contractAt("InvestmentToken", await strategy2.getInvestmentToken())
  const strategy3Token = await contractAt("InvestmentToken", await strategy3.getInvestmentToken())
  const portfolioToken = await contractAt("InvestmentToken", await portfolio.getInvestmentToken())

  console.log("------------------------------------------")
  logRed(header)
  console.log("Portfolio owned SUP1 token", await strategy1Token.balanceOf(portfolio.address))
  console.log("Portfolio owned SUP2 token", await strategy2Token.balanceOf(portfolio.address))
  console.log("Portfolio owned SUP3 token", await strategy3Token.balanceOf(portfolio.address))
  console.log("Portfolio owned FUSD token", await depositToken.balanceOf(portfolio.address))
  console.log("Alice owned portfolio token:", await portfolioToken.balanceOf(Alice))
  console.log("Alice owned SUP1 token:", await strategy1Token.balanceOf(Alice))
  console.log("Alice owned SUP2 token:", await strategy2Token.balanceOf(Alice))
  console.log("Alice owned SUP3 token:", await strategy3Token.balanceOf(Alice))
  console.log("Alice owned FUSD token", await depositToken.balanceOf(Alice))
  console.log("Bob owned portfolio token:", await portfolioToken.balanceOf(Bob))
  console.log("Bob owned SUP1 token:", await strategy1Token.balanceOf(Bob))
  console.log("Bob owned SUP2 token:", await strategy2Token.balanceOf(Bob))
  console.log("Bob owned SUP3 token:", await strategy3Token.balanceOf(Bob))
  console.log("Bob owned FUSD token", await depositToken.balanceOf(Bob))
  console.log("Charlie owned portfolio token:", await portfolioToken.balanceOf(Charlie))
  console.log("Charlie owned SUP1 token:", await strategy1Token.balanceOf(Charlie))
  console.log("Charlie owned SUP2 token:", await strategy2Token.balanceOf(Charlie))
  console.log("Charlie owned SUP3 token:", await strategy3Token.balanceOf(Charlie))
  console.log("Charlie owned FUSD token", await depositToken.balanceOf(Charlie))
  console.log("-----")
  printAssetValuations("Portfolio asset:", await portfolio.getAssetValuations(true, false))
  console.log("Portfolio equity:", await portfolio.getEquityValuation(true, false))
  console.log("Strategy 1 equity:", await strategy1.getEquityValuation(true, false))
  console.log("Strategy 1 accumulated fee:", await strategy1.getCurrentAccumulatedFee())
  console.log("Strategy 2 equity:", await strategy2.getEquityValuation(true, false))
  console.log("Strategy 2 accumulated fee:", await strategy2.getCurrentAccumulatedFee())
  console.log("Strategy 3 equity:", await strategy3.getEquityValuation(true, false))
  console.log("Strategy 3 accumulated fee:", await strategy3.getCurrentAccumulatedFee())
}

describe("Price oracle", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    const accounts = await ethers.getSigners()

    const oracle = await expectSuccess(deployPriceOracle(ContractAddrs.aaveOracle, (await getUsdcContract()).address))
    console.log(oracle.address)
    console.log(await oracle.getPrice("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", false, false))
  })
})
