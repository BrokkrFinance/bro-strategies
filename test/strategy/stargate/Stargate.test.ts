import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { StargateAddrs } from "../../shared/addresses"
import { Oracles } from "../../shared/oracles"
import { getErrorRange, airdropToken } from "../../shared/utils"
import { testStrategy } from "../Unified.test"

testStrategy(
  "Stargate USDC Strategy",
  "Stargate",
  [
    StargateAddrs.router,
    StargateAddrs.usdcPool,
    StargateAddrs.lpStaking,
    StargateAddrs.usdcLpToken,
    StargateAddrs.stgToken,
  ],
  Oracles.gmx,
  [testStargateUsdcAum, testStargateUsdcInitialize, testStargateUsdcUpgradeable]
)

testStrategy(
  "Stargate USDT Strategy",
  "Stargate",
  [
    StargateAddrs.router,
    StargateAddrs.usdtPool,
    StargateAddrs.lpStaking,
    StargateAddrs.usdtLpToken,
    StargateAddrs.stgToken,
  ],
  Oracles.aave,
  [testStargateUsdtAum, testStargateUsdtInitialize, testStargateUsdtUpgradeable]
)

function testStargateUsdcAum() {
  describe("AUM - Stargate USDC Strategy Specific", async function () {
    it("should success after a single deposit", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(StargateAddrs.usdcLpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(StargateAddrs.usdcLpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
    })

    it("should success after multiple deposits and withdrawals", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("20", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("20", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("10", 6), this.user0.address, [])

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(StargateAddrs.usdcLpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(StargateAddrs.usdcLpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })
  })
}

function testStargateUsdcInitialize() {
  describe("Initialize - Stargate USDC Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      await expect(
        upgrades.deployProxy(
          this.Strategy,
          [
            [
              this.investmentToken.address,
              this.usdc.address,
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
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            StargateAddrs.router,
            StargateAddrs.usdtPool,
            StargateAddrs.lpStaking,
            this.usdc.address,
            StargateAddrs.stgToken,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(this.strategy, "InvalidStargateLpToken")
    })
  })
}

function testStargateUsdcUpgradeable() {
  describe("Upgradeable - Stargate USDC Strategy Specific", async function () {
    it("should success to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const StargateV2 = await ethers.getContractFactory("StargateV2")
      const stargateV2 = await upgrades.upgradeProxy(this.strategy.address, StargateV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              this.usdc.address,
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
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            StargateAddrs.router,
            StargateAddrs.usdcPool,
            StargateAddrs.lpStaking,
            StargateAddrs.usdcLpToken,
            StargateAddrs.stgToken,
          ],
        },
      })
      await stargateV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      const equityValuationAfter = await this.strategy.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.strategy.name()).to.equal("brokkr.stargate_strategy.stargate_strategy_v2.0.0")
      expect(await this.strategy.humanReadableName()).to.equal("Stargate Strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}

function testStargateUsdtAum() {
  describe("AUM - Stargate USDT Strategy Specific", async function () {
    it("should success after a single deposit", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(StargateAddrs.usdtLpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(StargateAddrs.usdtLpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
    })

    it("should success after multiple deposits and withdrawals", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("20", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("20", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("10", 6), this.user0.address, [])

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(StargateAddrs.usdtLpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(StargateAddrs.usdtLpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })
  })
}

function testStargateUsdtInitialize() {
  describe("Initialize - Stargate USDT Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      await expect(
        upgrades.deployProxy(
          this.Strategy,
          [
            [
              this.investmentToken.address,
              this.usdc.address,
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
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            StargateAddrs.router,
            StargateAddrs.usdtPool,
            StargateAddrs.lpStaking,
            this.usdc.address,
            StargateAddrs.stgToken,
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(this.strategy, "InvalidStargateLpToken")
    })
  })
}

function testStargateUsdtUpgradeable() {
  describe("Upgradeable - Stargate USDT Strategy Specific", async function () {
    it("should success to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const StargateV2 = await ethers.getContractFactory("StargateV2")
      const stargateV2 = await upgrades.upgradeProxy(this.strategy.address, StargateV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              this.usdc.address,
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
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            StargateAddrs.router,
            StargateAddrs.usdtPool,
            StargateAddrs.lpStaking,
            StargateAddrs.usdtLpToken,
            StargateAddrs.stgToken,
          ],
        },
      })
      await stargateV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      const equityValuationAfter = await this.strategy.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.strategy.name()).to.equal("brokkr.stargate_strategy.stargate_strategy_v2.0.0")
      expect(await this.strategy.humanReadableName()).to.equal("Stargate Strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
