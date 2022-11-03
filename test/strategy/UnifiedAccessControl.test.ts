import { expect } from "chai"

export function testAccessControl() {
  describe("Access Control", async function () {
    it("should fail when a user without sufficient permissions sets deposit fee", async function () {
      await expect(this.strategy.connect(this.user0).setDepositFee(0, [])).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets withdrawal fee", async function () {
      await expect(this.strategy.connect(this.user0).setWithdrawalFee(0, [])).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets performance fee", async function () {
      await expect(this.strategy.connect(this.user0).setPerformanceFee(0, [])).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets fee receiver", async function () {
      await expect(this.strategy.connect(this.user0).setFeeReceiver(this.user0.address, [])).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets investment token", async function () {
      await expect(this.strategy.connect(this.user0).setInvestmentToken(this.usdc.address)).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets total investment limit", async function () {
      await expect(this.strategy.connect(this.user0).setTotalInvestmentLimit(0)).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets investment limit per address", async function () {
      await expect(this.strategy.connect(this.user0).setInvestmentLimitPerAddress(0)).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets price oracle", async function () {
      await expect(this.strategy.connect(this.user0).setPriceOracle(this.user0.address)).to.be.reverted
    })

    it("should fail when a user without sufficient permissions sets swap service", async function () {
      await expect(this.strategy.connect(this.user0).setSwapService(0, this.user0.address)).to.be.reverted
    })

    it("should succeed when a user with sufficient permissions sets withdrawal fee to 30%", async function () {
      expect(await this.strategy.setDepositFee(30000, []))
        .to.emit(this.strategy, "DepositFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getDepositFee([])).to.equal(30000)
    })

    it("should succeed when a user with sufficient permissions sets deposit fee to 30%", async function () {
      expect(await this.strategy.setWithdrawalFee(30000, []))
        .to.emit(this.strategy, "WithdrawalFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getWithdrawalFee([])).to.equal(30000)
    })

    it("should succeed when a user with sufficient permissions sets performance fee to 30%", async function () {
      expect(await this.strategy.setPerformanceFee(30000, []))
        .to.emit(this.strategy, "PerformanceFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getPerformanceFee([])).to.equal(30000)
    })

    it("should succeed when a user with sufficient permissions sets fee receiver", async function () {
      expect(await this.strategy.setFeeReceiver(this.user0.address, []))
        .to.emit(this.strategy, "FeeReceiverChange")
        .withArgs(this.user0.address, [])

      expect(await this.strategy.getFeeReceiver([])).to.equal(this.user0.address)
    })

    it("should succeed when a user with sufficient permissions sets investment token", async function () {
      expect(await this.strategy.setInvestmentToken(this.usdc.address)).not.to.be.reverted

      expect(await this.strategy.getInvestmentToken()).to.equal(this.usdc.address)
    })

    it("should succeed when a user with sufficient permissions sets total investment limit", async function () {
      expect(await this.strategy.setTotalInvestmentLimit(0)).not.to.be.reverted

      expect(await this.strategy.getTotalInvestmentLimit()).to.equal(0)
    })

    it("should succeed when a user with sufficient permissions sets investment limit per address", async function () {
      expect(await this.strategy.setInvestmentLimitPerAddress(0)).not.to.be.reverted

      expect(await this.strategy.getInvestmentLimitPerAddress()).to.equal(0)
    })

    it("should succeed when a user with sufficient permissions sets price oracle", async function () {
      expect(await this.strategy.setPriceOracle(this.user0.address)).not.to.be.reverted
    })

    it("should succeed when a user with sufficient permissions sets swap service", async function () {
      expect(await this.strategy.setSwapService(0, this.user0.address)).not.to.be.reverted
    })
  })
}
