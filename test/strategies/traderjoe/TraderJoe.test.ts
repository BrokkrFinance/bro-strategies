import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import Oracles from "../../../constants/Oracles.json"
import SwapServices from "../../../constants/SwapServices.json"
import Tokens from "../../../constants/addresses/Tokens.json"
import TraderJoe from "../../../constants/addresses/TraderJoe.json"
import { deployUUPSUpgradeableStrategyOwnable, upgradeStrategy } from "../../../scripts/helper/contract"
import TraderJoeLPTokenABI from "../../helper/abi/TraderJoeLPToken.json"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"
import { testStrategyReapRewardExtra } from "../StrategyReapRewardExtra.test"
import { testStrategyReapUninvestedReward } from "../StrategyReapUninvestedReward.test"

testStrategy("TraderJoe USDC-USDC.e Strategy - Deploy", deployTraderJoeStrategy, "TraderJoeV2", [
  testTraderJoeAum,
  testTraderJoeInitialize,
  testTraderJoeUpgradeable,
  testStrategyReapUninvestedReward,
  testStrategyReapRewardExtra,
])
testStrategy(
  "TraderJoe USDC-USDC.e Strategy - Upgrade After Deploy",
  upgradeTraderJoeStrategy,
  "TraderJoeV2",
  [
    testTraderJoeAum,
    testTraderJoeInitialize,
    testTraderJoeUpgradeable,
    testStrategyReapUninvestedReward,
    testStrategyReapRewardExtra,
  ]
)

async function deployTraderJoeStrategy() {
  // Strategy owner.
  const signers = await ethers.getSigners()
  const owner = signers[0]

  // Deploy strategy.
  const strategy = await deployUUPSUpgradeableStrategyOwnable(
    "TraderJoe",
    owner.address,
    {
      name: "InvestmentToken",
      symbol: "TraderJoeToken",
    },
    {
      depositToken: Tokens.usdc,
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
      extraArgs: [TraderJoe.router, TraderJoe.masterChef, TraderJoe.lpToken, TraderJoe.joeToken],
    }
  )

  return strategy
}

async function upgradeTraderJoeStrategy() {
  return upgradeStrategy("TraderJoe")
}

function testTraderJoeAum() {
  describe("AUM - TraderJoe Strategy Specific", async function () {
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

      const lpTokenContract = await ethers.getContractAt(TraderJoeLPTokenABI, TraderJoe.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("100", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset.toLowerCase()).to.equal(TraderJoe.lpToken.toLowerCase())
      expect(assetBalancesAfter[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset.toLowerCase()).to.equal(TraderJoe.lpToken.toLowerCase())
      expect(assetValuationsAfter[0].valuation).to.approximately(
        ethers.utils.parseUnits("100", 6).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("100", 6).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
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
        .withdraw(this.strategy, this.user0, {
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
        .withdraw(this.strategy, this.user0, {
          amount: availableTokenBalance.div(2),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const lpTokenContract = await ethers.getContractAt(TraderJoeLPTokenABI, TraderJoe.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("50", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset.toLowerCase()).to.equal(TraderJoe.lpToken.toLowerCase())
      expect(assetBalancesAfter[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset.toLowerCase()).to.equal(TraderJoe.lpToken.toLowerCase())
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

function testTraderJoeInitialize() {
  describe("Initialize - TraderJoe USDC Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      const Strategy = await ethers.getContractFactory("TraderJoe")

      await expect(
        upgrades.deployProxy(
          Strategy,
          [
            [
              this.investmentToken.address,
              Tokens.usdc,
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
            TraderJoe.router,
            TraderJoe.masterChef,
            Tokens.usdc,
            TraderJoe.joeToken,
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })
  })
}

function testTraderJoeUpgradeable() {
  describe("Upgradeable - TraderJoe Strategy Specific", async function () {
    it("should succeed to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const TraderJoeV2 = await ethers.getContractFactory("TraderJoeV2", this.owner)
      const traderJoeV2 = await upgrades.upgradeProxy(this.strategy.address, TraderJoeV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              Tokens.usdc,
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
            TraderJoe.router,
            TraderJoe.masterChef,
            TraderJoe.lpToken,
            TraderJoe.joeToken,
          ],
        },
      })
      await traderJoeV2.deployed()

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
      expect(await this.strategy.trackingName()).to.equal("brokkr.traderjoe_strategy.traderjoe_strategy_v2.0.0")
      expect(await this.strategy.humanReadableName()).to.equal("TraderJoe Strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
