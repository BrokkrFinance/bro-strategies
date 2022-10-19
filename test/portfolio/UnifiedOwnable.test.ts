import { expect } from "chai"

export function testOwnable() {
  describe("Ownable", async function () {
    it("should fail when the non-owner user sets deposit fee", async function () {
      await expect(this.portfolio.connect(this.user0).setDepositFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets withdrawal fee", async function () {
      await expect(this.portfolio.connect(this.user0).setWithdrawalFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets performance fee", async function () {
      await expect(this.portfolio.connect(this.user0).setPerformanceFee(0, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets fee receiver", async function () {
      await expect(this.portfolio.connect(this.user0).setFeeReceiver(this.user0.address, [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets investment token", async function () {
      await expect(this.portfolio.connect(this.user0).setInvestmentToken(this.usdc.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets total investment limit", async function () {
      await expect(this.portfolio.connect(this.user0).setTotalInvestmentLimit(0)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets investment limit per address", async function () {
      await expect(this.portfolio.connect(this.user0).setInvestmentLimitPerAddress(0)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user adds investable", async function () {
      await expect(this.portfolio.connect(this.user0).addInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user removes investable", async function () {
      await expect(this.portfolio.connect(this.user0).removeInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user changes investable", async function () {
      await expect(this.portfolio.connect(this.user0).changeInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets target investable allocations", async function () {
      await expect(this.portfolio.connect(this.user0).setTargetInvestableAllocations([])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user rebalances", async function () {
      await expect(this.portfolio.connect(this.user0).rebalance([], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should succeed when the owner user sets withdrawal fee to 30%", async function () {
      expect(await this.portfolio.connect(this.owner).setDepositFee(30000, []))
        .to.emit(this.portfolio, "DepositFeeChange")
        .withArgs(30000, [])

      expect(await this.portfolio.getDepositFee([])).to.equal(30000)
    })

    it("should succeed when the owner user sets deposit fee to 30%", async function () {
      expect(await this.portfolio.connect(this.owner).setWithdrawalFee(30000, []))
        .to.emit(this.portfolio, "WithdrawalFeeChange")
        .withArgs(30000, [])

      expect(await this.portfolio.getWithdrawalFee([])).to.equal(30000)
    })

    it("should succeed when the owner user sets performance fee to 30%", async function () {
      expect(await this.portfolio.connect(this.owner).setPerformanceFee(30000, []))
        .to.emit(this.portfolio, "PerformanceFeeChange")
        .withArgs(30000, [])

      expect(await this.portfolio.getPerformanceFee([])).to.equal(30000)
    })

    it("should succeed when the owner user sets fee receiver", async function () {
      expect(await this.portfolio.connect(this.owner).setFeeReceiver(this.user0.address, []))
        .to.emit(this.portfolio, "FeeReceiverChange")
        .withArgs(this.user0.address, [])

      expect(await this.portfolio.getFeeReceiver([])).to.equal(this.user0.address)
    })

    it("should succeed when the owner user sets investment token", async function () {
      expect(await this.portfolio.connect(this.owner).setInvestmentToken(this.usdc.address)).not.to.be.reverted

      expect(await this.portfolio.getInvestmentToken()).to.equal(this.usdc.address)
    })

    it("should succeed when the owner user sets total investment limit", async function () {
      expect(await this.portfolio.connect(this.owner).setTotalInvestmentLimit(0)).not.to.be.reverted

      expect(await this.portfolio.getTotalInvestmentLimit()).to.equal(0)
    })

    it("should succeed when the owner user sets investment limit per address", async function () {
      expect(await this.portfolio.connect(this.owner).setInvestmentLimitPerAddress(0)).not.to.be.reverted

      expect(await this.portfolio.getInvestmentLimitPerAddress()).to.equal(0)
    })

    // NOTE: Success case when the owner user adds investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user removes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user changes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user sets target investable allocations is in UnifiedAllocations.
    // NOTE: Success case when the owner user rebalances is in UnifiedRebalances.
  })
}
