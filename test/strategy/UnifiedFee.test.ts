import { expect } from "chai"
import { airdropToken } from "../shared/utils"

export function testFee() {
  describe("Fee", async function () {
    it("should success when any user calls claim fee", async function () {
      const usdcBalance = await this.usdc.balanceOf(this.impersonatedSigner.address)

      airdropToken(this.impersonatedSigner, this.user0, this.usdc, usdcBalance)

      await this.usdc.connect(this.user0).approve(this.strategy.address, usdcBalance)
      await this.strategy.connect(this.user0).deposit(usdcBalance, this.user0.address, [])

      await this.strategy.connect(this.user1).processReward([], [])

      const feeReceiver = await this.strategy.getFeeReceiver([])
      const feeAmount = await this.strategy.getCurrentAccumulatedFee()

      const usdcBalanceBefore = await this.usdc.balanceOf(feeReceiver)
      await expect(this.strategy.connect(this.user1).claimFee([]))
        .to.emit(this.strategy, "FeeClaim")
        .withArgs(feeAmount)
      const usdcBalanceAfter = await this.usdc.balanceOf(feeReceiver)

      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(0)
      expect(await this.strategy.getClaimedFee()).to.equal(feeAmount)
      expect(usdcBalanceAfter - usdcBalanceBefore).to.equal(feeAmount)
    })
  })
}
