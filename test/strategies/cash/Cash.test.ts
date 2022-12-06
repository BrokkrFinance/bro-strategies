import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { deployStrategy, upgradeStrategy } from "../../../scripts/helper/contract"
import { TestOptions } from "../../helper/interfaces/options"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"

const cashTestOptions: TestOptions = {
  upgradeTo: "OwnableV2",
  runReapRewardExtra: false,
  runReapUninvestedReward: false,
}

testStrategy("Cash Strategy - Deploy", deployCashStrategy, cashTestOptions, [testCashAum])
testStrategy(
  "Cash with Stargate USDC Strategy - Upgrade After Deploy",
  upgradeCashWithStargateUsdcStrategy,
  cashTestOptions,
  [testCashAum]
)
testStrategy(
  "Cash with Stargate USDT Strategy - Upgrade After Deploy",
  upgradeCashWithStargateUsdtStrategy,
  cashTestOptions,
  [testCashAum]
)
testStrategy("Cash with TraderJoe Strategy - Upgrade After Deploy", upgradeCashWithTraderJoeStrategy, cashTestOptions, [
  testCashAum,
])

async function deployCashStrategy() {
  return await deployStrategy("Cash")
}

async function upgradeCashWithStargateUsdcStrategy() {
  return await upgradeStrategy("CashWithStargateUSDC")
}

async function upgradeCashWithStargateUsdtStrategy() {
  return await upgradeStrategy("CashWithStargateUSDT")
}

async function upgradeCashWithTraderJoeStrategy() {
  return await upgradeStrategy("CashWithTraderJoe")
}

function testCashAum() {
  describe("AUM - Cash Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset).to.equal(this.usdc.address)
      expect(assetBalancesAfter[0].balance).to.approximately(
        ethers.utils.parseUnits("100", 6).add(assetBalancesBefore[0].balance),
        getErrorRange(ethers.utils.parseUnits("100", 6).add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset).to.equal(this.usdc.address)
      expect(assetValuationsAfter[0].valuation).to.be.approximately(
        ethers.utils.parseUnits("100", 6).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("100", 6).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("100", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("100", 6).add(this.equityValuation))
      )
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      // The first user deposits.
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("50", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance.div(2),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The first user deposits.
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("50", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance.div(2),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset).to.equal(this.usdc.address)
      expect(assetBalancesAfter[0].balance).to.approximately(
        ethers.utils.parseUnits("50", 6).add(assetBalancesBefore[0].balance),
        getErrorRange(ethers.utils.parseUnits("50", 6).add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset).to.equal(this.usdc.address)
      expect(assetValuationsAfter[0].valuation).to.approximately(
        ethers.utils.parseUnits("50", 6).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("50", 6).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("50", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("50", 6).add(this.equityValuation))
      )
    })
  })
}
