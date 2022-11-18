import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { createRolesArray } from "../helper/utils"

export function testStrategyUpgradeable() {
  describe("Upgradeable", async function () {
    it("should succeed when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newStrategy = await upgrades.upgradeProxy(this.strategy.address, NewStrategy, {
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
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              createRolesArray(this.owner.address),
            ],
          ],
        },
      })
      await newStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should succeed when the strategy is paused", async function () {
      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newStrategy = await upgrades.upgradeProxy(this.strategy.address, NewStrategy, {
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
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              createRolesArray(this.owner.address),
            ],
          ],
        },
      })
      await newStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.user0)
      await expect(
        upgrades.upgradeProxy(this.strategy.address, NewStrategy, {
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
                this.priceOracle,
                this.swapServiceProvider,
                this.swapServiceRouter,
                createRolesArray(this.owner.address),
              ],
            ],
          },
        })
      ).to.be.reverted
    })

    it("should succeed to leave all common state variables' value intact", async function () {
      // IAum.
      const investmentTokenSupplyBefore = await this.strategy.getInvestmentTokenSupply()
      // Don't check asset balances, liability balances, asset valuations, liability valuations
      // and equity valuation since they can be strategy specific.

      // IFee.
      const depositFeeBefore = await this.strategy.getDepositFee([])
      const totalDepositFeeBefore = await this.strategy.getTotalDepositFee([])
      const withdrawalFeeBefore = await this.strategy.getWithdrawalFee([])
      const totalWithdrawalFeeBefore = await this.strategy.getTotalWithdrawalFee([])
      const performanceFeeBefore = await this.strategy.getPerformanceFee([])
      const totalPerformanceFeeBefore = await this.strategy.getTotalPerformanceFee([])
      const feeReceiverBefore = await this.strategy.getFeeReceiver([])
      const currentAccumulatedFeeBefore = await this.strategy.getCurrentAccumulatedFee()
      const claimedFeeBefore = await this.strategy.getClaimedFee()

      // IInvestable.
      const depositTokenBefore = await this.strategy.getDepositToken()
      const investmentTokenBefore = await this.strategy.getInvestmentToken()
      const totalInvestmentLimitBefore = await this.strategy.getTotalInvestmentLimit()
      const investmentLimitPerAddressBefore = await this.strategy.getInvestmentLimitPerAddress()
      // Don't check name, humanReadableName and version since they can be strategy specific.

      // IReward and IStrategy have no getter.

      // Price oracle.
      const priceOracleBefore = await this.strategy.priceOracle()

      // Swap service.
      const swapServiceBefore = await this.strategy.swapService()

      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newStrategy = await upgrades.upgradeProxy(this.strategy.address, NewStrategy, {
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
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              createRolesArray(this.owner.address),
            ],
          ],
        },
      })
      await newStrategy.deployed()

      // IAum.
      const investmentTokenSupplyAfter = await this.strategy.getInvestmentTokenSupply()

      // IFee.
      const depositFeeAfter = await this.strategy.getDepositFee([])
      const totalDepositFeeAfter = await this.strategy.getTotalDepositFee([])
      const withdrawalFeeAfter = await this.strategy.getWithdrawalFee([])
      const totalWithdrawalFeeAfter = await this.strategy.getTotalWithdrawalFee([])
      const performanceFeeAfter = await this.strategy.getPerformanceFee([])
      const totalPerformanceFeeAfter = await this.strategy.getTotalPerformanceFee([])
      const feeReceiverAfter = await this.strategy.getFeeReceiver([])
      const currentAccumulatedFeeAfter = await this.strategy.getCurrentAccumulatedFee()
      const claimedFeeAfter = await this.strategy.getClaimedFee()

      // IInvestable.
      const depositTokenAfter = await this.strategy.getDepositToken()
      const investmentTokenAfter = await this.strategy.getInvestmentToken()
      const totalInvestmentLimitAfter = await this.strategy.getTotalInvestmentLimit()
      const investmentLimitPerAddressAfter = await this.strategy.getInvestmentLimitPerAddress()

      // IReward and IStrategy have no getter.

      // Price oracle.
      const priceOracleAfter = await this.strategy.priceOracle()

      // Swap service.
      const swapServiceAfter = await this.strategy.swapService()

      // IAum.
      expect(investmentTokenSupplyBefore.eq(investmentTokenSupplyAfter)).to.equal(true)

      // IFee.
      expect(depositFeeBefore == depositFeeAfter).to.equal(true)
      expect(totalDepositFeeBefore == totalDepositFeeAfter).to.equal(true)
      expect(withdrawalFeeBefore == withdrawalFeeAfter).to.equal(true)
      expect(totalWithdrawalFeeBefore == totalWithdrawalFeeAfter).to.equal(true)
      expect(performanceFeeBefore == performanceFeeAfter).to.equal(true)
      expect(totalPerformanceFeeBefore == totalPerformanceFeeAfter).to.equal(true)
      expect(feeReceiverBefore == feeReceiverAfter).to.equal(true)
      expect(currentAccumulatedFeeBefore.eq(currentAccumulatedFeeAfter)).to.equal(true)
      expect(claimedFeeBefore.eq(claimedFeeAfter)).to.equal(true)

      // IInvestable.
      expect(depositTokenBefore == depositTokenAfter).to.equal(true)
      expect(investmentTokenBefore == investmentTokenAfter).to.equal(true)
      expect(totalInvestmentLimitBefore.eq(totalInvestmentLimitAfter)).to.equal(true)
      expect(investmentLimitPerAddressBefore.eq(investmentLimitPerAddressAfter)).to.equal(true)

      // Price oracle.
      expect(priceOracleBefore == priceOracleAfter).to.equal(true)

      // Swap service.
      expect(swapServiceBefore.provider == swapServiceAfter.provider).to.equal(true)
      expect(swapServiceBefore.router == swapServiceAfter.router).to.equal(true)
    })
  })
}