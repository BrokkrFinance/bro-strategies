import { expect } from "chai"

export function testOwnable() {
  describe("Ownable", async function () {
    it("should fail when the non-owner user sets deposit fee", async function () {
      await expect(this.strategy.connect(this.user0).setDepositFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets withdrawal fee", async function () {
      await expect(this.strategy.connect(this.user0).setWithdrawalFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets performance fee", async function () {
      await expect(this.strategy.connect(this.user0).setPerformanceFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets fee receiver", async function () {
      await expect(this.strategy.connect(this.user0).setFeeReceiver(this.user0.address, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets investment token", async function () {
      await expect(this.strategy.connect(this.user0).setInvestmentToken(this.usdc.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets total investment limit", async function () {
      await expect(this.strategy.connect(this.user0).setTotalInvestmentLimit(0)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets investment limit per address", async function () {
      await expect(this.strategy.connect(this.user0).setInvestmentLimitPerAddress(0)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets price oracle", async function () {
      await expect(this.strategy.connect(this.user0).setPriceOracle(this.user0.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets swap service", async function () {
      await expect(this.strategy.connect(this.user0).setSwapService(0, this.user0.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the owner user sets deposit fee greater than or equal to 100%", async function () {
      await expect(this.strategy.setDepositFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should fail when the owner user sets withdrawal fee greater than or equal to 100%", async function () {
      await expect(this.strategy.setWithdrawalFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should fail when the owner user sets performance fee greater than or equal to 100%", async function () {
      await expect(this.strategy.setPerformanceFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should success when the owner user sets withdrawal fee to 30%", async function () {
      expect(await this.strategy.setDepositFee(30000, []))
        .to.emit(this.strategy, "DepositFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getDepositFee([])).to.equal(30000)
    })

    it("should success when the owner user sets deposit fee to 30%", async function () {
      expect(await this.strategy.setWithdrawalFee(30000, []))
        .to.emit(this.strategy, "WithdrawalFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getWithdrawalFee([])).to.equal(30000)
    })

    it("should success when the owner user sets performance fee to 30%", async function () {
      expect(await this.strategy.setPerformanceFee(30000, []))
        .to.emit(this.strategy, "PerformanceFeeChange")
        .withArgs(30000, [])

      expect(await this.strategy.getPerformanceFee([])).to.equal(30000)
    })

    it("should success when the owner user sets fee receiver", async function () {
      expect(await this.strategy.setFeeReceiver(this.user0.address, []))
        .to.emit(this.strategy, "FeeReceiverChange")
        .withArgs(this.user0.address, [])

      expect(await this.strategy.getFeeReceiver([])).to.equal(this.user0.address)
    })

    it("should success when the owner user sets investment token", async function () {
      expect(await this.strategy.setInvestmentToken(this.usdc.address)).not.to.be.reverted

      expect(await this.strategy.getInvestmentToken()).to.equal(this.usdc.address)
    })

    it("should success when the owner user sets total investment limit", async function () {
      expect(await this.strategy.setTotalInvestmentLimit(0)).not.to.be.reverted

      expect(await this.strategy.getTotalInvestmentLimit()).to.equal(0)
    })

    it("should success when the owner user sets investment limit per address", async function () {
      expect(await this.strategy.setInvestmentLimitPerAddress(0)).not.to.be.reverted

      expect(await this.strategy.getInvestmentLimitPerAddress()).to.equal(0)
    })

    it("should success when the owner user sets price oracle", async function () {
      expect(await this.strategy.setPriceOracle(this.user0.address)).not.to.be.reverted
    })

    it("should success when the owner user sets swap service", async function () {
      expect(await this.strategy.setSwapService(0, this.user0.address)).not.to.be.reverted
    })
  })
}
