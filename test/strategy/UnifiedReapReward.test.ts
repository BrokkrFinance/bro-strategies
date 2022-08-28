import { expect } from "chai"
import { airdropToken } from "../shared/utils"

export function testReapReward() {
  describe("ReapReward", async function () {
    it("should success when any user processes reward", async function () {
      const usdcBalance = await this.usdc.balanceOf(this.impersonatedSigner.address)

      airdropToken(this.impersonatedSigner, this.user0, this.usdc, usdcBalance)

      await this.usdc.connect(this.user0).approve(this.strategy.address, usdcBalance)
      await this.strategy.connect(this.user0).deposit(usdcBalance, this.user0.address, [])

      await expect(this.strategy.connect(this.user1).processReward([], [])).to.emit(this.strategy, "RewardProcess")
    })
  })
}
