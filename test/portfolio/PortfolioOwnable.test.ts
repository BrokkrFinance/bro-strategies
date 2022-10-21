import { expect } from "chai"
import { testOwnable } from "../shared/Ownable.test"

export function testPortfolioOwnable() {
  describe("Ownable", async function () {
    testOwnable()

    it("should fail when the non-owner user adds investable", async function () {
      await expect(this.portfolio.connect(this.user0).addInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user removes investable", async function () {
      await expect(this.portfolio.connect(this.user0).removeInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user changes investable", async function () {
      await expect(this.portfolio.connect(this.user0).changeInvestable(this.usdc.address, [], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets target investable allocations", async function () {
      await expect(this.portfolio.connect(this.user0).setTargetInvestableAllocations([])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user rebalances", async function () {
      await expect(this.portfolio.connect(this.user0).rebalance([], [])).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    // NOTE: Success case when the owner user adds investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user removes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user changes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user sets target investable allocations is in UnifiedAllocations.
    // NOTE: Success case when the owner user rebalances is in UnifiedRebalances.
  })
}
