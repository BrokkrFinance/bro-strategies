import { expect } from "chai"
import { testAccessControl } from "../shared/AccessControl.test"

export function testStrategyAccessControl() {
  describe("AccessControl", async function () {
    testAccessControl()

    it("should fail when the non-owner user sets price oracle", async function () {
      await expect(this.strategy.connect(this.user0).setPriceOracle(this.user0.address)).to.be.reverted
    })

    it("should fail when the non-owner user sets swap service", async function () {
      await expect(this.strategy.connect(this.user0).setSwapService(0, this.user0.address)).to.be.reverted
    })

    it("should succeed when the owner user sets price oracle", async function () {
      expect(await this.strategy.connect(this.owner).setPriceOracle(this.user0.address)).not.to.be.reverted
    })

    it("should succeed when the owner user sets swap service", async function () {
      expect(await this.strategy.connect(this.owner).setSwapService(0, this.user0.address)).not.to.be.reverted
    })
  })
}
