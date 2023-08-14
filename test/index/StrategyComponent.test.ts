import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { burn, mint } from "./helper/InvestHelper"
import { defaultAffiliatorAddress } from "../helper/constants"

export function testStrategyComponent() {
  describe("Component", async function () {
    it("should succeed when the owner adds and removes a new component", async function () {
      await expect(this.strategy.connect(this.owner).addComponent(this.user0.address)).not.to.be.reverted

      await expect(this.strategy.connect(this.owner).removeComponent(this.user0.address)).not.to.be.reverted
    })

    it("should succeed to deposit and withdraw after the owner adds a new component", async function () {
      // Add component with 0 weight.
      await expect(this.strategy.connect(this.owner).addComponent(this.user0.address)).not.to.be.reverted

      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      // User 0 withdraws.
      const indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })

    it("should fail when the owner attempts to remove non-zero weight component", async function () {
      const components = await this.strategy.allComponents()

      let component: string

      for (component of components) {
        const weight = await this.strategy.weights(component)

        if (weight > 0) {
          break
        }
      }

      expect(await this.strategy.weights(component!)).to.be.above(0)

      await expect(this.strategy.connect(this.owner).removeComponent(component!)).to.be.reverted
    })

    // Note: Rebalancing after add a component is in StrategyRebalance.test.ts.
    // Note: Rebalancing before remove a component is in StrategyRebalance.test.ts.
  })
}
