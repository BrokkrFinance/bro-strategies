import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getMonthsInSeconds } from "../helper/utils"

export function testStrategyReapReward() {
  describe("ReapReward", async function () {
    it("should succeed when any user processes reward", async function () {
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Wait 1 month to reward get accrued.
      await mine(getMonthsInSeconds(1))

      await expect(this.strategy.connect(this.user1).processReward([], [])).to.emit(this.strategy, "RewardProcess")
    })
  })
}
