import { expect } from "chai"
import { ethers } from "hardhat"
import { airdropToken } from "../shared/utils"

export function testReapReward() {
  describe("ReapReward", async function () {
    it("should success when any user processes reward", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("10000", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10000", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      // Wait 1 month to reward get accrued.
      await ethers.provider.send("evm_increaseTime", [86400 * 30])
      await ethers.provider.send("evm_mine", [])

      await expect(this.strategy.connect(this.user1).processReward([], [])).to.emit(this.strategy, "RewardProcess")
    })

    it("should success to earn larger reward when reap after 1 year", async function () {
      if ((await this.strategy.humanReadableName()) == "Cash strategy") {
        return
      }

      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("10000", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10000", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      const filterRewardProcess = (event: { event: string }) => event.event == "RewardProcess"

      // Wait 1 week to reward get accrued.
      await ethers.provider.send("evm_increaseTime", [86400 * 7])
      await ethers.provider.send("evm_mine", [])

      const txBefore = await this.strategy.processReward([], [])
      const reciptBefore = await txBefore.wait()
      const eventBefore = reciptBefore.events.filter(filterRewardProcess)[0]
      const rewardAmountBefore = eventBefore.args.amount.toBigInt()

      // Wait another 1 year more.
      await ethers.provider.send("evm_increaseTime", [86400 * 365])
      await ethers.provider.send("evm_mine", [])

      const txAfter = await this.strategy.processReward([], [])
      const reciptAfter = await txAfter.wait()
      const eventAfter = reciptAfter.events.filter(filterRewardProcess)[0]
      const rewardAmountAfter = eventAfter.args.amount.toBigInt()

      expect(rewardAmountAfter > rewardAmountBefore && rewardAmountBefore > 0).to.equal(true)
    })
  })
}
