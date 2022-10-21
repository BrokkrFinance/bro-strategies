import { expect } from "chai"

export function testOwnable() {
  it("should fail when the non-owner user sets deposit fee", async function () {
    await expect(this.investable.connect(this.user0).setDepositFee(0, [])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets withdrawal fee", async function () {
    await expect(this.investable.connect(this.user0).setWithdrawalFee(0, [])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets performance fee", async function () {
    await expect(this.investable.connect(this.user0).setPerformanceFee(0, [])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets fee receiver", async function () {
    await expect(this.investable.connect(this.user0).setFeeReceiver(this.user0.address, [])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets investment token", async function () {
    await expect(this.investable.connect(this.user0).setInvestmentToken(this.usdc.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets total investment limit", async function () {
    await expect(this.investable.connect(this.user0).setTotalInvestmentLimit(0)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should fail when the non-owner user sets investment limit per address", async function () {
    await expect(this.investable.connect(this.user0).setInvestmentLimitPerAddress(0)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
  })

  it("should succeed when the owner user sets withdrawal fee to 30%", async function () {
    expect(await this.investable.connect(this.owner).setDepositFee(30000, []))
      .to.emit(this.investable, "DepositFeeChange")
      .withArgs(30000, [])

    expect(await this.investable.getDepositFee([])).to.equal(30000)
  })

  it("should succeed when the owner user sets deposit fee to 30%", async function () {
    expect(await this.investable.connect(this.owner).setWithdrawalFee(30000, []))
      .to.emit(this.investable, "WithdrawalFeeChange")
      .withArgs(30000, [])

    expect(await this.investable.getWithdrawalFee([])).to.equal(30000)
  })

  it("should succeed when the owner user sets performance fee to 30%", async function () {
    expect(await this.investable.connect(this.owner).setPerformanceFee(30000, []))
      .to.emit(this.investable, "PerformanceFeeChange")
      .withArgs(30000, [])

    expect(await this.investable.getPerformanceFee([])).to.equal(30000)
  })

  it("should succeed when the owner user sets fee receiver", async function () {
    expect(await this.investable.connect(this.owner).setFeeReceiver(this.user0.address, []))
      .to.emit(this.investable, "FeeReceiverChange")
      .withArgs(this.user0.address, [])

    expect(await this.investable.getFeeReceiver([])).to.equal(this.user0.address)
  })

  it("should succeed when the owner user sets investment token", async function () {
    expect(await this.investable.connect(this.owner).setInvestmentToken(this.usdc.address)).not.to.be.reverted

    expect(await this.investable.getInvestmentToken()).to.equal(this.usdc.address)
  })

  it("should succeed when the owner user sets total investment limit", async function () {
    expect(await this.investable.connect(this.owner).setTotalInvestmentLimit(0)).not.to.be.reverted

    expect(await this.investable.getTotalInvestmentLimit()).to.equal(0)
  })

  it("should succeed when the owner user sets investment limit per address", async function () {
    expect(await this.investable.connect(this.owner).setInvestmentLimitPerAddress(0)).not.to.be.reverted

    expect(await this.investable.getInvestmentLimitPerAddress()).to.equal(0)
  })
}
