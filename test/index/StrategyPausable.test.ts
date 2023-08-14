import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { burn, mint } from "./helper/InvestHelper"
import { defaultAffiliatorAddress } from "../helper/constants"

export function testStrategyPausable() {
  describe("Pausable", async function () {
    it("should fail when the non-owner user pauses", async function () {
      await expect(this.strategy.connect(this.user0).pause()).to.be.reverted
    })

    it("should fail when any user deposits and the strategy is paused", async function () {
      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals),
        defaultAffiliatorAddress,
        true
      )
    })

    it("should fail when any user withdraws and the strategy is paused", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      const indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1),
        true
      )
    })
  })
}
