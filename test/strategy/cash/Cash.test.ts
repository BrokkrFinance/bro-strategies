import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { Oracles } from "../../shared/oracles"
import { airdropToken } from "../../shared/utils"
import { testStrategy } from "../Unified.test"

testStrategy("Cash Strategy", "Cash", [], Oracles.gmx, [testCashAum, testCashUpgradeable])

function testCashAum() {
  describe("AUM - Cash Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset).to.equal(this.usdc.address)
      expect(assetBalances[0].balance).to.equal(ethers.utils.parseUnits("100", 6))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset).to.equal(this.usdc.address)
      expect(assetValuations[0].valuation).to.equal(ethers.utils.parseUnits("100", 6))

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.equal(ethers.utils.parseUnits("100", 6))
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
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
      expect(assetBalances[0].asset).to.equal(this.usdc.address)
      expect(assetBalances[0].balance).to.equal(ethers.utils.parseUnits("70", 6))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset).to.equal(this.usdc.address)
      expect(assetValuations[0].valuation).to.equal(ethers.utils.parseUnits("70", 6))

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.equal(ethers.utils.parseUnits("70", 6))
    })
  })
}

function testCashUpgradeable() {
  describe("Upgradeable - Cash Strategy Specific", async function () {
    it("should succeed to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const CashV2 = await ethers.getContractFactory("CashV2")
      const cashV2 = await upgrades.upgradeProxy(this.strategy.address, CashV2, {
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
          ],
        },
      })
      await cashV2.deployed()

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
      expect(await this.strategy.trackingName()).to.equal("brokkr.cash_strategy.cash_strategy_initial")
      expect(await this.strategy.humanReadableName()).to.equal("Cash strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
