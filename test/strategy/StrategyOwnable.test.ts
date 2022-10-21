import { expect } from "chai"
import { testOwnable } from "../shared/Ownable.test"

export function testStrategyOwnable() {
  describe("Ownable", async function () {
    testOwnable()

    it("should fail when the non-owner user sets price oracle", async function () {
      await expect(this.strategy.connect(this.user0).setPriceOracle(this.user0.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should fail when the non-owner user sets swap service", async function () {
      await expect(this.strategy.connect(this.user0).setSwapService(0, this.user0.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should succeed when the owner user sets investment limit per address", async function () {
      expect(await this.strategy.connect(this.owner).setInvestmentLimitPerAddress(0)).not.to.be.reverted

      expect(await this.strategy.getInvestmentLimitPerAddress()).to.equal(0)
    })

    it("should succeed when the owner user sets price oracle", async function () {
      expect(await this.strategy.connect(this.owner).setPriceOracle(this.user0.address)).not.to.be.reverted
    })

    it("should succeed when the owner user sets swap service", async function () {
      expect(await this.strategy.connect(this.owner).setSwapService(0, this.user0.address)).not.to.be.reverted
    })
  })
}
