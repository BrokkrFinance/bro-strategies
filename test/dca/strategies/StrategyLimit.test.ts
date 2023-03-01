// testing for access control limits and other limits such as position limit, deposit limit...
import { expect } from "chai"
import { ethers } from "hardhat"

export function testStrategyLimit() {
  describe("Limit", async function () {
    it("should fail on too small amount", async function () {
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))

      await expect(this.strategy.connect(this.user3).deposit("100", 1)).to.be.revertedWithCustomError(
        this.strategy,
        "TooSmallDeposit"
      )
    })

    it("should fail on position limit reached", async function () {
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("3000", 6))

      for (let i = 1; i <= 52; i++) {
        await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), i)
      }

      await expect(
        this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), 100)
      ).to.be.revertedWithCustomError(this.strategy, "PositionsLimitReached")
    })

    it("should fail on unauthorized invest access", async function () {
      await expect(this.strategy.connect(this.user3).invest()).to.be.revertedWith("Unauthorized")
    })
  })
}
