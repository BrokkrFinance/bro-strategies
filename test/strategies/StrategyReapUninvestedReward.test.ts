import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getMonthsInSeconds } from "../helper/utils"

export function testStrategyReapUninvestedReward() {
  describe("ReapUninvestedReward", async function () {
    it("should succeed when any user processes reward", async function () {
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Uninvested deposit token amount is above zero
      const uninvestedDepositTokenAmountBeforeReaping = await this.strategy.uninvestedDepositTokenAmount()
      expect(uninvestedDepositTokenAmountBeforeReaping).to.be.above(0)

      const assetBalancesBefore = await this.strategy.getAssetBalances()

      // fast forward the time and reap rewards
      await mine(getMonthsInSeconds(1))
      await expect(this.strategy.connect(this.user1).processReward([], [])).to.emit(this.strategy, "RewardProcess")

      // The new uninvested deposit token amount decreased after reaping
      const uninvestedDepositTokenAmountAfterReaping = await this.strategy.uninvestedDepositTokenAmount()
      expect(uninvestedDepositTokenAmountBeforeReaping).to.be.above(uninvestedDepositTokenAmountAfterReaping)

      // All assets should increase except the uninvested deposit token amount
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetBalancesLength = assetBalancesBefore.length
      expect(assetBalancesLength).to.be.equal(assetBalancesAfter.length)
      for (const [index, asset] of assetBalancesBefore.entries()) {
        if (index < assetBalancesLength - 1) expect(asset[1]).to.be.below(assetBalancesAfter[index][1])
        else expect(asset[1]).to.be.above(assetBalancesAfter[index][1])
      }

      // Uninvested deposit amount is still above 0
      expect(await this.strategy.uninvestedDepositTokenAmount()).to.be.above(0)
    })
  })
}
