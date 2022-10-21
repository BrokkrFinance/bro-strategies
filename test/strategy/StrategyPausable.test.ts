import { expect } from "chai"
import { ethers } from "hardhat"
import { testPausable } from "../shared/Pausable.test"

export function testStrategyPausable() {
  describe("Pausable", async function () {
    testPausable()

    it("should fail when any user withdraws reward and the strategy is paused", async function () {
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("3000", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      await expect(this.strategy.connect(this.user0).withdrawReward([])).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
    })
  })
}
