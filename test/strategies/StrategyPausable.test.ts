import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { testPausable } from "../shared/Pausable.test"

export function testStrategyPausable() {
  describe("Pausable", async function () {
    testPausable()

    it("should fail when any user withdraws reward and the strategy is paused", async function () {
      const user0BalanceBefore = await this.depositToken.balanceOf(this.user0.address)
      await this.depositToken
        .connect(this.user0)
        .approve(this.strategy.address, ethers.utils.parseUnits("3", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user0)
        .deposit(ethers.utils.parseUnits("3", this.depositTokenDecimals), BigNumber.from(0), this.user0.address, [])

      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      await expect(this.strategy.connect(this.user0).withdrawReward([])).to.be.revertedWith("Pausable: paused")

      expect(user0BalanceBefore.sub(await this.depositToken.balanceOf(this.user0.address))).to.equal(
        ethers.utils.parseUnits("3", this.depositTokenDecimals)
      )
    })
  })
}
