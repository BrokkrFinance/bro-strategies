import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import investableAbi from "../../shared/abi/investable.json"
import { StargateAddrs, TokenAddrs, TraderJoeAddrs } from "../../shared/addresses"
import { getUUPSUpgradeablePortfolio, getUUPSUpgradeableStrategy } from "../../shared/contracts"
import { Oracles } from "../../shared/oracles"
import { PortfolioArgs, StrategyArgs } from "../../shared/parameters"
import { SwapServices } from "../../shared/swaps"
import { getErrorRange } from "../../shared/utils"
import { testPortfolio } from "../Unified.test"

testPortfolio("PercentageAllocation Portfolio", deployPercentageAllocationPortfolio, [
  testPercentageAllocationPortfolioAum,
  testPercentageAllocationPortfolioERC165,
  testPercentageAllocationPortfolioUpgradeable,
])

async function deployPercentageAllocationPortfolio() {
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
  const cash = await getUUPSUpgradeableStrategy("Cash", strategyArgs, { extraArgs: [] })

  //////////////// Stargate USDC wrapper portfolio.

  // Stargate USDC strategy
  const stargateUsdc = await getUUPSUpgradeableStrategy("Stargate", strategyArgs, {
    extraArgs: [
      StargateAddrs.router,
      StargateAddrs.usdcPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdcLpToken,
      StargateAddrs.stgToken,
    ],
  })

  // Stargate USDC wrapper portfolio
  const stargateUsdcPortfolio = await getUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, stargateUsdc],
    [[100000], [0, 100000]]
  )

  //////////////// Stargate USDT wrapper portfolio.

  // Stargate USDT strategy
  const stargateUsdt = await getUUPSUpgradeableStrategy("Stargate", strategyArgs, {
    extraArgs: [
      StargateAddrs.router,
      StargateAddrs.usdtPool,
      StargateAddrs.lpStaking,
      StargateAddrs.usdtLpToken,
      StargateAddrs.stgToken,
    ],
  })

  // Stargate USDT wrapper portfolio
  const stargateUsdtPortfolio = await getUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, stargateUsdt],
    [[100000], [0, 100000]]
  )

  //////////////// TraderJoe USDC-USDC.e wrapper portfolio.

  // TraderJoe USDC-USDC.e strategy
  const traderjoe = await getUUPSUpgradeableStrategy("TraderJoe", strategyArgs, {
    extraArgs: [TraderJoeAddrs.router, TraderJoeAddrs.masterChef, TraderJoeAddrs.lpToken, TraderJoeAddrs.joeToken],
  })

  // TraderJoe USDC-USDC.e wrapper portfolio
  const traderjoePortfolio = await getUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [cash, traderjoe],
    [[100000], [0, 100000]]
  )

  // Top level portfolio.
  const portfolio = await getUUPSUpgradeablePortfolio(
    "PercentageAllocation",
    portfolioArgs,
    { extraArgs: [] },
    [stargateUsdcPortfolio, stargateUsdtPortfolio, traderjoePortfolio],
    [[100000], [50000, 50000], [30000, 30000, 40000]]
  )

  return portfolio
}

function testPercentageAllocationPortfolioAum() {
  describe("AUM - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed after a single deposit", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      let investableAddr, investable

      const assetBalances = await this.portfolio.getAssetBalances()
      const investables = await this.portfolio.getInvestables()

      investableAddr = await investables[0].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[0].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("900", 6),
        getErrorRange(ethers.utils.parseUnits("900", 6))
      )

      investableAddr = await investables[1].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[1].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[1].balance).to.approximately(
        ethers.utils.parseUnits("900", 6),
        getErrorRange(ethers.utils.parseUnits("900", 6))
      )

      investableAddr = await investables[2].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[2].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[2].balance).to.approximately(
        ethers.utils.parseUnits("1200", 6),
        getErrorRange(ethers.utils.parseUnits("1200", 6))
      )

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.portfolio.getAssetValuations(true, false)

      investableAddr = await investables[0].investable
      expect(assetValuations[0].asset).to.equal(investableAddr)
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("900", 6),
        getErrorRange(ethers.utils.parseUnits("900", 6))
      )

      investableAddr = await investables[1].investable
      expect(assetValuations[1].asset).to.equal(investableAddr)
      expect(assetValuations[1].valuation).to.approximately(
        ethers.utils.parseUnits("900", 6),
        getErrorRange(ethers.utils.parseUnits("900", 6))
      )

      investableAddr = await investables[2].investable
      expect(assetValuations[2].asset).to.equal(investableAddr)
      expect(assetValuations[2].valuation).to.approximately(
        ethers.utils.parseUnits("1200", 6),
        getErrorRange(ethers.utils.parseUnits("1200", 6))
      )

      expect(await this.portfolio.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.portfolio.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("2000", 6))
      await this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("2000", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1000", 6))
      await this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("1000", 6), this.user0.address, [])

      let investableAddr, investable

      const assetBalances = await this.portfolio.getAssetBalances()
      const investables = await this.portfolio.getInvestables()

      investableAddr = await investables[0].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[0].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("2100", 6),
        getErrorRange(ethers.utils.parseUnits("2100", 6))
      )

      investableAddr = await investables[1].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[1].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[1].balance).to.approximately(
        ethers.utils.parseUnits("2100", 6),
        getErrorRange(ethers.utils.parseUnits("2100", 6))
      )

      investableAddr = await investables[2].investable
      investable = await ethers.getContractAt(investableAbi, investableAddr)
      expect(assetBalances[2].asset).to.equal(await investable.getInvestmentToken())
      expect(assetBalances[2].balance).to.approximately(
        ethers.utils.parseUnits("2800", 6),
        getErrorRange(ethers.utils.parseUnits("2800", 6))
      )

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.portfolio.getAssetValuations(true, false)

      investableAddr = await investables[0].investable
      expect(assetValuations[0].asset).to.equal(investableAddr)
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("2100", 6),
        getErrorRange(ethers.utils.parseUnits("2100", 6))
      )

      investableAddr = await investables[1].investable
      expect(assetValuations[1].asset).to.equal(investableAddr)
      expect(assetValuations[1].valuation).to.approximately(
        ethers.utils.parseUnits("2100", 6),
        getErrorRange(ethers.utils.parseUnits("2100", 6))
      )

      investableAddr = await investables[2].investable
      expect(assetValuations[2].asset).to.equal(investableAddr)
      expect(assetValuations[2].valuation).to.approximately(
        ethers.utils.parseUnits("2800", 6),
        getErrorRange(ethers.utils.parseUnits("2800", 6))
      )

      expect(await this.portfolio.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.portfolio.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("7000", 6),
        getErrorRange(ethers.utils.parseUnits("7000", 6))
      )
    })
  })
}

function testPercentageAllocationPortfolioERC165() {
  describe("ERC165 - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed to support all interfaces that portfolio implements", async function () {
      expect(await this.portfolio.supportsInterface("0x49147370")).to.equal(true) // IAum
      expect(await this.portfolio.supportsInterface("0x52f3b8ca")).to.equal(true) // IFee
      expect(await this.portfolio.supportsInterface("0x60145abe")).to.equal(true) // IInvestable
      expect(await this.portfolio.supportsInterface("0x7461375e")).to.equal(true) // IPortfolio
    })
  })
}

function testPercentageAllocationPortfolioUpgradeable() {
  describe("Upgradeable - PercentageAllocation Portfolio Specific", async function () {
    it("should succeed to leave all portfolio specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)
      const equityValuationBefore = await this.portfolio.getEquityValuation(true, false)

      const PortfolioV2 = await ethers.getContractFactory("PercentageAllocationV2")
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
