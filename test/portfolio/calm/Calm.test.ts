import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import investableAbi from "../../helper/abi/investable.json"
import { StargateAddrs, TokenAddrs, TraderJoeAddrs } from "../../helper/addresses"
import { deployUUPSUpgradeablePortfolio, deployUUPSUpgradeableStrategy, upgradePortfolio } from "../../helper/contracts"
import { Oracles } from "../../helper/oracles"
import { PortfolioArgs, StrategyArgs } from "../../helper/parameters"
import { SwapServices } from "../../helper/swaps"
import { getErrorRange } from "../../helper/utils"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, [testCalmPortfolioAum, testCalmPortfolioUpgradeable])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, [
  testCalmPortfolioAum,
  testCalmPortfolioUpgradeable,
])

async function deployCalmPortfolio() {
  // Portfolios and strategies owner.
  const signers = await ethers.getSigners()
  const owner = signers[0]

  // Strategy arguments.
  const strategyArgs: StrategyArgs = {
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
    depositFee: { amount: 0, params: [] },
    withdrawalFee: { amount: 0, params: [] },
    performanceFee: { amount: 0, params: [] },
    feeReceiver: { address: owner.address, params: [] },
    investmentLimit: { total: BigInt(1e20), perAddress: BigInt(1e20) },
  }

  // Cash strategy.
  const cash = await deployUUPSUpgradeableStrategy("Cash", strategyArgs, { extraArgs: [] })

  //////////////// Stargate USDC wrapper portfolio.

  // Stargate USDC strategy
  const stargateUsdc = await deployUUPSUpgradeableStrategy("Stargate", strategyArgs, {
    extraArgs: [
      StargateAddrs.router,
      StargateAddrs.usdcPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdcLpToken,
      StargateAddrs.stgToken,
    ],
  })

  // Stargate USDC wrapper portfolio
  const stargateUsdcPortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, stargateUsdc],
    [[100000], [0, 100000]]
  )

  //////////////// Stargate USDT wrapper portfolio.

  // Stargate USDT strategy
  const stargateUsdt = await deployUUPSUpgradeableStrategy("Stargate", strategyArgs, {
    extraArgs: [
      StargateAddrs.router,
      StargateAddrs.usdtPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdtLpToken,
      StargateAddrs.stgToken,
    ],
  })

  // Stargate USDT wrapper portfolio
  const stargateUsdtPortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, stargateUsdt],
    [[100000], [0, 100000]]
  )

  //////////////// TraderJoe USDC-USDC.e wrapper portfolio.

  // TraderJoe USDC-USDC.e strategy
  const traderjoe = await deployUUPSUpgradeableStrategy("TraderJoe", strategyArgs, {
    extraArgs: [TraderJoeAddrs.router, TraderJoeAddrs.masterChef, TraderJoeAddrs.lpToken, TraderJoeAddrs.joeToken],
  })

  // TraderJoe USDC-USDC.e wrapper portfolio
  const traderjoePortfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, traderjoe],
    [[100000], [0, 100000]]
  )

  // Top level portfolio.
  const portfolio = await deployUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [stargateUsdcPortfolio, stargateUsdtPortfolio, traderjoePortfolio],
    [[100000], [50000, 50000], [30000, 30000, 40000]]
  )

  return portfolio
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("portfolio/Calm.json")
}

function testCalmPortfolioAum() {
  describe("AUM - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed after a single deposit", async function () {
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)

      const investableDescs = await this.portfolio.getInvestables()

      for (const [i, investableDesc] of investableDescs.entries()) {
        const investableAddr = await investableDesc.investable
        const allocationPercentage = await investableDesc.allocationPercentage

        const investable = await ethers.getContractAt(investableAbi, investableAddr)
        const investableDepositAmount = ethers.utils.parseUnits("3000", 6).mul(allocationPercentage).div(1e5)

        expect(assetBalancesAfter[i].asset).to.equal(await investable.getInvestmentToken())
        expect(assetBalancesAfter[i].balance).to.approximately(
          investableDepositAmount.add(assetBalancesBefore[i].balance),
          getErrorRange(investableDepositAmount.add(assetBalancesBefore[i].balance))
        )
        expect(assetValuationsAfter[i].asset).to.equal(investableAddr)
        expect(assetValuationsAfter[i].valuation).to.approximately(
          investableDepositAmount.add(assetValuationsBefore[i].valuation),
          getErrorRange(investableDepositAmount.add(assetValuationsBefore[i].valuation))
        )
      }

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("2000", 6))
      await this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("2000", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1000", 6))
      await this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("1000", 6), this.user0.address, [])

      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)

      const investableDescs = await this.portfolio.getInvestables()

      for (const [i, investableDesc] of investableDescs.entries()) {
        const investableAddr = await investableDesc.investable
        const allocationPercentage = await investableDesc.allocationPercentage

        const investable = await ethers.getContractAt(investableAbi, investableAddr)
        const investableDepositAmount = ethers.utils.parseUnits("7000", 6).mul(allocationPercentage).div(1e5)

        expect(assetBalancesAfter[i].asset).to.equal(await investable.getInvestmentToken())
        expect(assetBalancesAfter[i].balance).to.approximately(
          investableDepositAmount.add(assetBalancesBefore[i].balance),
          getErrorRange(investableDepositAmount.add(assetBalancesBefore[i].balance))
        )
        expect(assetValuationsAfter[i].asset).to.equal(investableAddr)
        expect(assetValuationsAfter[i].valuation).to.approximately(
          investableDepositAmount.add(assetValuationsBefore[i].valuation),
          getErrorRange(investableDepositAmount.add(assetValuationsBefore[i].valuation))
        )
      }

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty
    })
  })
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
              TokenAddrs.usdc,
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
