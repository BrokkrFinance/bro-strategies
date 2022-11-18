import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import Oracles from "../../../constants/Oracles.json"
import Stargate from "../../../constants/addresses/Stargate.json"
import SwapServices from "../../../constants/SwapServices.json"
import Tokens from "../../../constants/addresses/Tokens.json"
import TraderJoe from "../../../constants/addresses/TraderJoe.json"
import {
  deployUUPSUpgradeablePortfolio,
  deployUUPSUpgradeableStrategyOwnable,
  upgradePortfolio,
} from "../../../scripts/helper/contract"
import { InvestmentTokenArgs, PortfolioArgs, StrategyArgs } from "../../../scripts/interfaces/parameters"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, "PortfolioV2", [testCalmPortfolioUpgradeable])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, "PortfolioV2", [
  testCalmPortfolioUpgradeable,
])

async function deployCalmPortfolio() {
  // Portfolios and strategies owner.
  const signers = await ethers.getSigners()
  const owner = signers[0]

  // Investment token arguments.
  const investmentTokenArgs: InvestmentTokenArgs = {
    name: "InvestmentToken",
    symbol: "IVT",
  }

  // Strategy arguments.
  const strategyArgs: StrategyArgs = {
    depositToken: Tokens.usdc,
    depositFee: { amount: 0, params: [] },
    withdrawalFee: { amount: 0, params: [] },
    performanceFee: { amount: 0, params: [] },
    feeReceiver: { address: owner.address, params: [] },
    investmentLimit: { total: BigInt(1e20), perAddress: BigInt(1e20) },
    oracle: Oracles.aave,
    swapService: SwapServices.traderjoe,
    roleToUsers: [],
  }

  // Portfolio arguments.
  const portfolioArgs: PortfolioArgs = {
    depositToken: Tokens.usdc,
    depositFee: { amount: 0, params: [] },
    withdrawalFee: { amount: 0, params: [] },
    performanceFee: { amount: 0, params: [] },
    feeReceiver: { address: owner.address, params: [] },
    investmentLimit: { total: BigInt(1e20), perAddress: BigInt(1e20) },
  }

  // Cash strategy.
  const cash = await deployUUPSUpgradeableStrategyOwnable("Cash", owner.address, investmentTokenArgs, strategyArgs, {
    extraArgs: [],
  })

  //////////////// Stargate USDC wrapper portfolio.

  // Stargate USDC strategy
  const stargateUSDC = await deployUUPSUpgradeableStrategyOwnable(
    "Stargate",
    owner.address,
    investmentTokenArgs,
    strategyArgs,
    {
      extraArgs: [Stargate.router, Stargate.usdcPool, Stargate.lpStaking, Stargate.usdcLPToken, Stargate.stgToken],
    }
  )

  // Stargate USDC wrapper portfolio
  const stargateUSDCPortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    owner.address,
    investmentTokenArgs,
    portfolioArgs,
    { extraArgs: [] },
    [cash.address, stargateUSDC.address],
    [[100000], [0, 100000]]
  )

  //////////////// Stargate USDT wrapper portfolio.

  // Stargate USDT strategy
  const stargateUSDT = await deployUUPSUpgradeableStrategyOwnable(
    "Stargate",
    owner.address,
    investmentTokenArgs,
    strategyArgs,
    {
      extraArgs: [Stargate.router, Stargate.usdtPool, Stargate.lpStaking, Stargate.usdtLPToken, Stargate.stgToken],
    }
  )

  // Stargate USDT wrapper portfolio
  const stargateUSDTPortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    owner.address,
    investmentTokenArgs,
    portfolioArgs,
    { extraArgs: [] },
    [cash.address, stargateUSDT.address],
    [[100000], [0, 100000]]
  )

  //////////////// TraderJoe USDC-USDC.e wrapper portfolio.

  // TraderJoe USDC-USDC.e strategy
  const traderjoe = await deployUUPSUpgradeableStrategyOwnable(
    "TraderJoe",
    owner.address,
    investmentTokenArgs,
    strategyArgs,
    {
      extraArgs: [TraderJoe.router, TraderJoe.masterChef, TraderJoe.lpToken, TraderJoe.joeToken],
    }
  )

  // TraderJoe USDC-USDC.e wrapper portfolio
  const traderjoePortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    owner.address,
    investmentTokenArgs,
    portfolioArgs,
    { extraArgs: [] },
    [cash.address, traderjoe.address],
    [[100000], [0, 100000]]
  )

  // Top level portfolio.
  const portfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    owner.address,
    investmentTokenArgs,
    portfolioArgs,
    { extraArgs: [] },
    [stargateUSDCPortfolio.address, stargateUSDTPortfolio.address, traderjoePortfolio.address],
    [[100000], [50000, 50000], [30000, 30000, 40000]]
  )

  return portfolio
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("Calm")
}

function testCalmPortfolioUpgradeable() {
  describe("Upgradeable - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed to leave all portfolio specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)
      const equityValuationBefore = await this.portfolio.getEquityValuation(true, false)

      const PortfolioV2 = await ethers.getContractFactory("PercentageAllocationV2", this.owner)
      const portfolioV2 = await upgrades.upgradeProxy(this.portfolio.address, PortfolioV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              Tokens.usdc,
              this.depositFee,
              this.depositFeeParams,
              this.withdrawalFee,
              this.withdrawalFeeParams,
              this.performanceFee,
              this.performanceFeeParams,
              this.feeReceiver,
              this.feeReceiverParams,
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
            ],
          ],
        },
      })
      await portfolioV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)
      const equityValuationAfter = await this.portfolio.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.portfolio.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.portfolio.trackingName()).to.equal(
        "brokkr.percentage_allocation_portfolio.percentage_allocation_portfolio_v2.0.0"
      )
      expect(await this.portfolio.humanReadableName()).to.equal("Percentage allocation portfolio")
      expect(await this.portfolio.version()).to.equal("2.0.0")
    })
  })
}