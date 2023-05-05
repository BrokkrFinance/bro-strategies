import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { burn, mint } from "./helper/InvestHelper"

export function testStrategyRebalance() {
  describe("Rebalance", async function () {
    it("should succeed when rebalance with usual target weights", async function () {
      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10000", 6)
      )

      const components = await this.strategy.allComponents()
      const targetWeights = []

      for (const component of components) {
        targetWeights.push(await this.strategy.weights(component))
      }

      // Set target weights.
      for (let i = 0; i < targetWeights.length; i++) {
        if (i % 2 == 0) {
          targetWeights[i] = targetWeights[i].mul(105).div(100)
        } else {
          targetWeights[i] = targetWeights[i].mul(95).div(100)
        }
      }

      // Rebalance.
      await expect(this.strategy.connect(this.owner).rebalance(targetWeights)).not.to.be.reverted

      // Check if actual weights and target weights are differ within 5% error range.
      const actualWeights = []

      for (const component of components) {
        actualWeights.push(await this.strategy.weights(component))
      }

      for (let i = 0; i < components.length; i++) {
        expect(actualWeights[i]).to.be.approximately(targetWeights[i], targetWeights[i].mul(5).div(100))
      }

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("10000", 6)
      )

      // User 1 withdraws.
      const indexTokenBalance = await this.indexToken.balanceOf(this.user1.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })

    it("should succeed when rebalance with 0 target weight and remove component", async function () {
      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10000", 6)
      )

      const components = await this.strategy.allComponents()
      const targetWeights = []

      for (const component of components) {
        targetWeights.push(await this.strategy.weights(component))
      }

      // Set target weights with 0 weight.
      targetWeights[0] = 0
      for (let i = 1; i < targetWeights.length; i++) {
        targetWeights[i] = targetWeights[i].mul(101).div(100)
      }

      // Rebalance.
      await expect(this.strategy.connect(this.owner).rebalance(targetWeights)).not.to.be.reverted

      // Check if actual weight becomes 0.
      expect(await this.strategy.weights(components[0])).to.be.equal(0)

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )

      let indexTokenBalance: BigNumber

      // User 1 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user1.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // Remove component.
      await expect(this.strategy.connect(this.owner).removeComponent(components[0])).not.to.be.reverted

      expect((await this.strategy.allComponents()).length).to.be.equal(components.length - 1)

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )

      // User 1 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user2.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })
  })
}
