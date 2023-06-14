import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"

export function testPausable() {
  it("should fail when the non-owner user pauses", async function () {
    await expect(this.investable.connect(this.user0).pause()).to.be.reverted
  })

  it("should fail when any user deposits and the investable is paused", async function () {
    expect(await this.investable.connect(this.owner).pause()).not.to.be.reverted

    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWith("Pausable: paused")
  })

  it("should fail when any user withdraws and the investable is paused", async function () {
    await this.depositToken
      .connect(this.user0)
      .approve(this.investable.address, ethers.utils.parseUnits("3", this.depositTokenDecimals))
    await this.investable
      .connect(this.user0)
      .deposit(ethers.utils.parseUnits("3", this.depositTokenDecimals), BigNumber.from(0), this.user0.address, [])

    expect(await this.investable.connect(this.owner).pause()).not.to.be.reverted

    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWith("Pausable: paused")

    expect(await this.depositToken.balanceOf(this.user0.address)).to.equal(
      ethers.utils.parseUnits("97", this.depositTokenDecimals)
    )
  })
}
