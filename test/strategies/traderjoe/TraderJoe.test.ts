import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import Tokens from "../../../constants/addresses/Tokens.json"
import TraderJoe from "../../../constants/addresses/TraderJoe.json"
import { deployStrategy, upgradeStrategy } from "../../../scripts/helper/contract"
import { TestOptions } from "../../helper/interfaces/options"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"

const traderjoeTestOptions: TestOptions = {
  upgradeTo: "OwnableV2",
  runReapReward: false,
  runReapRewardExtra: false,
  runReapUninvestedReward: false,
}

testStrategy("TraderJoe USDC-USDC.e Strategy - Deploy", deployTraderJoeStrategy, traderjoeTestOptions, [
  testTraderJoeAum,
  testTraderJoeInitialize,
])
testStrategy("TraderJoe USDC-USDC.e Strategy - Upgrade After Deploy", upgradeTraderJoeStrategy, traderjoeTestOptions, [
  testTraderJoeAum,
])

async function deployTraderJoeStrategy() {
  return await deployStrategy("TraderJoe")
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

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)

      expect(assetBalancesBefore.length == assetBalancesAfter.length)
      for (let i = 0; i < assetBalancesBefore.length - 1; i++) {
        expect(assetBalancesBefore[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
        expect(assetBalancesAfter[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
      }

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore.length == assetValuationsAfter.length)
      for (let i = 0; i < assetValuationsBefore.length - 1; i++) {
        expect(assetValuationsBefore[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
        expect(assetValuationsAfter[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
      }

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

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)

      expect(assetBalancesBefore.length == assetBalancesAfter.length)
      for (let i = 0; i < assetBalancesBefore.length - 1; i++) {
        expect(assetBalancesBefore[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
        expect(assetBalancesAfter[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
      }

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore.length == assetValuationsAfter.length)
      for (let i = 0; i < assetValuationsBefore.length - 1; i++) {
        expect(assetValuationsBefore[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
        expect(assetValuationsAfter[i].asset.toLowerCase()).to.equal(TraderJoe.lbPair.toLowerCase())
      }

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
    it("should fail when passed different length of bin IDs and allocations", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [0, 1, 2],
            [300, 700],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when passed too few bins", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [],
            [1000],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when passed too many bins", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
              29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
            ],
            [1000],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when passed too big bin ID", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [16777216], // 2^24.
            [1000],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when too few allocations", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [8388608],
            [],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when too many allocations", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [8388608],
            [
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
              29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
            ],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when too small allocations", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [8388607, 8388608, 8388609],
            [0, 700, 299], // It's sum should be 1e3.
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })

    it("should fail when too big allocations", async function () {
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
            TraderJoe.lbPair,
            TraderJoe.lbRouter,
            1,
            [8388607, 8388608, 8388609],
            [0, 700, 301],
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })
  })
}
