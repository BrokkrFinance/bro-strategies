import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { getDaysInSeconds, getMonthsInSeconds, getYearsInSeconds } from "../helper/utils"

export function testStrategyReapReward() {
  describe("ReapReward", async function () {
    it("should succeed when any user processes reward", async function () {
      await this.depositHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Wait 1 month to reward get accrued.
      await mine(getMonthsInSeconds(1))

      await expect(this.strategy.connect(this.user1).processReward([], [])).to.emit(this.strategy, "RewardProcess")
    })

    it("should succeed to earn larger reward when reap after 1 year", async function () {
      if ((await this.strategy.humanReadableName()) == "Cash strategy") {
        return
      }

      await this.depositHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const filterRewardProcess = (event: { event: string }) => event.event == "RewardProcess"

      // Wait 1 week to reward get accrued.
      await mine(getDaysInSeconds(7))

      const txBefore = await this.strategy.processReward([], [])
      const reciptBefore = await txBefore.wait()
      const eventBefore = reciptBefore.events.filter(filterRewardProcess)[0]
      const rewardAmountBefore = eventBefore.args.amount.toBigInt()

      // Wait another 1 year more.
      await mine(getYearsInSeconds(1))

      const txAfter = await this.strategy.processReward([], [])
      const reciptAfter = await txAfter.wait()
      const eventAfter = reciptAfter.events.filter(filterRewardProcess)[0]
      const rewardAmountAfter = eventAfter.args.amount.toBigInt()

      expect(rewardAmountAfter > rewardAmountBefore && rewardAmountBefore > 0).to.equal(true)
    })
  })
}
