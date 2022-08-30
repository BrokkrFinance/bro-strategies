import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import { getErrorRange, airdropToken } from "../../shared/utils"
import { testStrategy } from "../Unified.test"

testStrategy("Cash Strategy", "Cash", [], [testCashAum, testCashDeposit, testCashUpgradeable])

function testCashAum() {
  describe("AUM - Cash Strategy Specific", async function () {
    it("should success after a single deposit", async function () {
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

function testCashDeposit() {
  describe("Deposit - Cash Strategy Specific", async function () {
    it("should success when a single user deposits the possible minimum USDC", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, 1)
      await this.strategy.connect(this.user0).deposit(1, this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("100", 6).sub(1))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(1)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(1)
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        BigNumber.from(1),
        getErrorRange(BigNumber.from(1))
      )
    })

    it("should success when multiple users deposit the possible minimum USDC - 0", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user2, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user0).deposit(1, this.user0.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user0.address, this.user0.address, 1)

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("100", 6).sub(1))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(1)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(1)
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        BigNumber.from(1),
        getErrorRange(BigNumber.from(1))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(1))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(1))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user2).deposit(1, this.user2.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user2.address, this.user2.address, 1)

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("100", 6).sub(1))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        BigNumber.from(1),
        getErrorRange(BigNumber.from(1))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(2),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(2))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(2),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(2))
      )
    })

    it("should success when multiple users deposit the possible minimum USDC - 1", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user2, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user1).deposit(1, this.user1.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user1.address, this.user1.address, 1)

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("100", 6).sub(1))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        BigNumber.from(1),
        getErrorRange(BigNumber.from(1))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(1))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(1))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("30", 6), this.user2.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(1))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(1),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(1))
      )
    })
  })
}

function testCashUpgradeable() {
  describe("Upgradeable - Cash Strategy Specific", async function () {
    it("should success to leave all strategy specific state variables' value intact", async function () {
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
      expect(await this.strategy.name()).to.equal("block42.cash_strategy.cash_strategy_initial")
      expect(await this.strategy.humanReadableName()).to.equal("Cash strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
