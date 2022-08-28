import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

export function testUpgradeable() {
  describe("Upgradeable", async function () {
    it("should success when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const TestUpgradedStrategy = await ethers.getContractFactory("TestUpgradedStrategy")
      const upgradedStrategy = await upgrades.upgradeProxy(this.strategy.address, TestUpgradedStrategy, {
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
      await upgradedStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should success when the strategy is paused", async function () {
      expect(await this.strategy.pause()).not.to.be.reverted

      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const TestUpgradedStrategy = await ethers.getContractFactory("TestUpgradedStrategy")
      const upgradedStrategy = await upgrades.upgradeProxy(this.strategy.address, TestUpgradedStrategy, {
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
      await upgradedStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const TestUpgradedStrategy = await ethers.getContractFactory("TestUpgradedStrategy", this.user0)
      await expect(
        upgrades.upgradeProxy(this.strategy.address, TestUpgradedStrategy, {
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
      ).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })
}
