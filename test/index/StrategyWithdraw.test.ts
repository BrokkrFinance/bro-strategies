import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { NativeToken } from "../../scripts/constants/deposit-tokens"
import { burn, mint } from "./helper/InvestHelper"
import { defaultAffiliatorAddress } from "../helper/constants"

export function testStrategyWithdraw() {
  describe("Withdraw", async function () {
    it("should succeed when a single user withdraws IndexToken fully", async function () {
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

    it("should succeed when a single user withdraws IndexToken fully for other person", async function () {
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
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })

    it("should succeed when a single user withdraws IndexToken partially", async function () {
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
        indexTokenBalance.div(2),
        BigNumber.from(1)
      )
    })

    it("should succeed when a single user withdraws IndexToken partially for other person", async function () {
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
        this.user1,
        this.depositToken,
        indexTokenBalance.div(2),
        BigNumber.from(1)
      )
    })

    it("should succeed when multiple users withdraw", async function () {
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

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("5", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5.123", this.depositTokenDecimals),
        defaultAffiliatorAddress
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

      // User 2 withdraws.
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

      // User 0 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
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

    it("should succeed when multiple users withdraw for other person", async function () {
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

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("5", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5.123", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      let indexTokenBalance: BigNumber

      // User 1 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user1.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user2,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 2 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user2.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 0 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user2,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })

    it("should fail when a user set minimum out too high", async function () {
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

      if (this.depositTokenAddress === NativeToken) {
        const amountNative = await this.strategy.connect(this.user0).getAmountNATIVEFromExactIndex(indexTokenBalance)

        await this.indexToken.connect(this.user0).approve(this.strategy.address, indexTokenBalance)
        await expect(
          this.strategy
            .connect(this.user0)
            .burnExactIndexForNATIVE(amountNative.add(1), indexTokenBalance, this.user0.address)
        ).to.be.reverted
      } else {
        const amountToken = await this.strategy
          .connect(this.user0)
          .getAmountTokenFromExactIndex(this.depositTokenAddress, indexTokenBalance)

        await this.indexToken.connect(this.user0).approve(this.strategy.address, indexTokenBalance)

        await expect(
          this.strategy.connect(this.user0).burnExactIndexForToken(
            this.depositTokenAddress,
            amountToken.add(ethers.utils.parseUnits("0.1", this.depositTokenDecimals)), // Estimation on Solidly forks has a minor error. Adding 0.1 token will give us desired result.
            indexTokenBalance,
            this.user0.address
          )
        ).to.be.reverted
      }
    })
  })
}
