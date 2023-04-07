import { expect } from "chai"
import { BigNumber } from "ethers"

export function testStrategyLimit() {
  describe("Limit", async function () {
    it("should fail when reached equity valuation limit", async function () {
      const equityValuationLimit: BigNumber = (await this.strategy.equityValuationLimit()).div(1e8) // 1e8 is equityValuation's decimals.
      const exceedingAmount = equityValuationLimit.mul(2).mul(1e6) // 1e6 is depositToken's decimals.

      const whaleBalance: BigNumber = await this.depositToken.balanceOf(this.whale.address)

      expect(whaleBalance).to.be.greaterThanOrEqual(exceedingAmount)

      // Deposit large enough amount so that equity valuation increment exceed equity valuation limit.
      const depositAmount = exceedingAmount

      const [amountIndex] = await this.strategy
        .connect(this.whale)
        .getAmountIndexFromToken(this.depositToken.address, depositAmount)

      const amountToken = await this.strategy.getAmountTokenFromExactIndex(this.depositToken.address, amountIndex)

      // TODO: This only holds when the price of depositToken equals to 1 USD.
      expect(amountToken.div(1e6)).to.be.greaterThanOrEqual(equityValuationLimit)

      await this.depositToken.connect(this.whale).approve(this.strategy.address, depositAmount)
      await expect(
        this.strategy
          .connect(this.whale)
          .mintIndexFromToken(this.depositToken.address, depositAmount, amountIndex, this.whale.address)
      ).to.be.reverted
    })
  })
}
