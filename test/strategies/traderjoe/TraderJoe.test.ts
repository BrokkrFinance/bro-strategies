import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import Tokens from "../../../constants/addresses/Tokens.json"
import TraderJoe from "../../../constants/addresses/TraderJoe.json"
import { deployStrategy, upgradeStrategy } from "../../../scripts/helper/contract"
import TraderJoeLPTokenABI from "../../helper/abi/TraderJoeLPToken.json"
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
  // testTraderJoeAum,
  // testTraderJoeInitialize,
])
testStrategy("TraderJoe USDC-USDC.e Strategy - Upgrade After Deploy", upgradeTraderJoeStrategy, traderjoeTestOptions, [
  // testTraderJoeAum,
  // testTraderJoeInitialize,
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
