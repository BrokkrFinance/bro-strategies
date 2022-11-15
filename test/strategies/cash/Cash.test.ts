import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import Oracles from "../../../constants/Oracles.json"
import SwapServices from "../../../constants/SwapServices.json"
import { deployUUPSUpgradeableStrategy, upgradeStrategy } from "../../../scripts/helper/contract"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"
import { testStrategyReapRewardExtra } from "../StrategyReapRewardExtra.test"

testStrategy("Cash Strategy - Deploy", deployCashStrategy, "OwnableStrategyV2", [
  testCashAum,
  testCashUpgradeable,
  testStrategyReapRewardExtra,
])
testStrategy(
  "Cash with Stargate USDC Strategy - Upgrade After Deploy",
  upgradeCashWithStargateUsdcStrategy,
  "OwnableStrategyV2",
  [testCashAum, testCashUpgradeable, testStrategyReapRewardExtra]
)
testStrategy(
  "Cash with Stargate USDT Strategy - Upgrade After Deploy",
  upgradeCashWithStargateUsdtStrategy,
  "OwnableStrategyV2",
  [testCashAum, testCashUpgradeable, testStrategyReapRewardExtra]
)
testStrategy(
  "Cash with TraderJoe Strategy - Upgrade After Deploy",
  upgradeCashWithTraderJoeStrategy,
  "OwnableStrategyV2",
  [testCashAum, testCashUpgradeable, testStrategyReapRewardExtra]
)

async function deployCashStrategy() {
  // Strategy owner.
  const signers = await ethers.getSigners()
  const owner = signers[0]

  // Deploy strategy.
  const strategy = await deployUUPSUpgradeableStrategy(
    "Cash",
    {
      depositFee: { amount: 0, params: [] },
      withdrawalFee: { amount: 0, params: [] },
      performanceFee: { amount: 0, params: [] },
      feeReceiver: { address: owner.address, params: [] },
      investmentLimit: { total: BigInt(1e20), perAddress: BigInt(1e20) },
      oracle: Oracles.aave,
      swapService: SwapServices.traderjoe,
      roleToUsers: [],
    },
    {
      extraArgs: [],
    }
  )

  return strategy
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

function testCashUpgradeable() {
  describe("Upgradeable - Cash Strategy Specific", async function () {
    it("should succeed to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const CashV2 = await ethers.getContractFactory("CashV2", this.owner)
      const cashV2 = await upgrades.upgradeProxy(this.strategy.address, CashV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              this.usdc.address,
              this.depositFee,
              this.depositFeeParams,
              this.withdrawalFee,
              this.withdrawalFeeParams,
              this.performanceFee,
              this.performanceFeeParams,
              this.feeReceiver,
              this.feeReceiverParams,
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              [],
            ],
          ],
        },
      })
      await cashV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      const equityValuationAfter = await this.strategy.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.strategy.trackingName()).to.equal("brokkr.cash_strategy.cash_strategy_initial")
      expect(await this.strategy.humanReadableName()).to.equal("Cash strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
