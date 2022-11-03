import { expect } from "chai"
import { BigNumber } from "ethers"
import { testAccessControl } from "../shared/AccessControl.test"

export function testPortfolioAccessControl() {
  describe("Ownable", async function () {
    testAccessControl()

    it("should fail when the non-owner user adds investable", async function () {
      await expect(this.portfolio.connect(this.user0).addInvestable(this.usdc.address, [], [])).to.be.reverted
    })

    it("should fail when the non-owner user removes investable", async function () {
      await expect(this.portfolio.connect(this.user0).removeInvestable(this.usdc.address, [], [])).to.be.reverted
    })

    it("should fail when the non-owner user changes investable", async function () {
      await expect(this.portfolio.connect(this.user0).changeInvestable(this.usdc.address, [], [])).to.be.reverted
    })

    it("should fail when the non-owner user sets target investable allocations", async function () {
      await expect(this.portfolio.connect(this.user0).setTargetInvestableAllocations([])).to.be.reverted
    })

    it("should fail when the non-owner user rebalances", async function () {
      await expect(this.portfolio.connect(this.user0).rebalance(BigNumber.from(0), [], [])).to.be.reverted
    })

    // NOTE: Success case when the owner user adds investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user removes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user changes investable is in UnifiedInvestable.
    // NOTE: Success case when the owner user sets target investable allocations is in UnifiedAllocations.
    // NOTE: Success case when the owner user rebalances is in UnifiedRebalances.
  })
}
