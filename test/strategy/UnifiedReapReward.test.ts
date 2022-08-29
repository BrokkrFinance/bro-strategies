import { expect } from "chai"
import { ethers } from "hardhat"
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

    it("should success to earn larger reward when reap after 1 year", async function () {
      if ((await this.strategy.humanReadableName()) == "Cash strategy") {
        return
      }

      const usdcBalance = await this.usdc.balanceOf(this.impersonatedSigner.address)

      airdropToken(this.impersonatedSigner, this.user0, this.usdc, usdcBalance)

      await this.usdc.connect(this.user0).approve(this.strategy.address, usdcBalance)
      await this.strategy.connect(this.user0).deposit(usdcBalance, this.user0.address, [])

      const filterRewardProcess = (event: { event: string }) => event.event == "RewardProcess"

      const txBefore = await this.strategy.processReward([], [])
      const reciptBefore = await txBefore.wait()
      const eventBefore = reciptBefore.events.filter(filterRewardProcess)[0]
      const rewardAmountBefore = eventBefore.args.amount.toBigInt()

      await ethers.provider.send("evm_increaseTime", [3600 * 24 * 36])
      await ethers.provider.send("evm_mine", [])

      const txAfter = await this.strategy.processReward([], [])
      const reciptAfter = await txAfter.wait()
      const eventAfter = reciptAfter.events.filter(filterRewardProcess)[0]
      const rewardAmountAfter = eventAfter.args.amount.toBigInt()

      expect(rewardAmountAfter > rewardAmountBefore && rewardAmountBefore > 0).to.equal(true)
    })
  })
}
