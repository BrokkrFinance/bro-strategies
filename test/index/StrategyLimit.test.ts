import { expect } from "chai"
import { BigNumber } from "ethers"

export function testStrategyLimit() {
  describe("Limit", async function () {
    it("should fail when reached equity valuation limit", async function () {
      const equityValuationLimit: BigNumber = (await this.strategy.equityValuationLimit()).div(1e8) // 1e8 is equityValuation's decimals.

      let depositAmount: BigNumber
      let amountIndex: BigNumber

      const maxTrial = 20

      for (let multiplier = 2; multiplier < maxTrial; multiplier++) {
        const exceedingAmount = equityValuationLimit.mul(multiplier).mul(1e6) // 1e6 is depositToken's decimals.

        const whaleBalance: BigNumber = await this.depositToken.balanceOf(this.whale.address)

        expect(whaleBalance).to.be.greaterThanOrEqual(exceedingAmount)

        // Deposit large enough amount so that equity valuation increment exceed equity valuation limit.
        const _depositAmount = exceedingAmount

        const [_amountIndex] = await this.strategy
          .connect(this.whale)
          .getAmountIndexFromToken(this.depositTokenAddress, _depositAmount)

        const amountToken = await this.strategy.getAmountTokenFromExactIndex(this.depositTokenAddress, _amountIndex)

        // TODO: This only holds when the price of depositToken equals to 1 USD.
        if (amountToken.div(1e6) >= equityValuationLimit) {
          depositAmount = _depositAmount
          amountIndex = _amountIndex
          break
        }

        if (multiplier === maxTrial - 1) {
          throw new Error("Failed to find deposit amount that exceeds equity valuation limit.")
        }
      }

      await this.depositToken.connect(this.whale).approve(this.strategy.address, depositAmount!)
      await expect(
        this.strategy
          .connect(this.whale)
          .mintIndexFromToken(this.depositTokenAddress, depositAmount!, amountIndex!, this.whale.address)
      ).to.be.reverted
    })
  })
}
