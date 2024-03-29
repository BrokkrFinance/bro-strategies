import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, upgrades } from "hardhat"
import Stargate from "../../../constants/avalanche/addresses/Stargate.json"
import Tokens from "../../../constants/avalanche/addresses/Tokens.json"
import TraderJoe from "../../../constants/avalanche/addresses/TraderJoe.json"
import { Avalanche } from "../../../constants/networks/Avalanche"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { upgradeStrategy } from "../../../scripts/contracts/forking/upgrade"
import StargateLPTokenABI from "../../helper/abi/StargateLPToken.json"
import { StrategyTestOptions } from "../../helper/interfaces/options"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"

const stargateTestOptions: StrategyTestOptions = {
  network: Avalanche(),
  forkAt: 29197000,
  upgradeTo: "OwnableV2",
  runReapUninvestedReward: false,
}

testStrategy("Stargate USDC Strategy - Deploy", deployStargateUSDCStrategy, stargateTestOptions, [
  testStargateUSDCAum,
  testStargateUSDCInitialize,
])
testStrategy("Stargate USDT Strategy - Deploy", deployStargateUSDTStrategy, stargateTestOptions, [
  testStargateUSDTAum,
  testStargateUSDTInitialize,
])
testStrategy("Stargate USDC Strategy - Upgrade After Deploy", upgradeStargateUSDCStrategy, stargateTestOptions, [
  testStargateUSDCAum,
])
testStrategy("Stargate USDT Strategy - Upgrade After Deploy", upgradeStargateUSDTStrategy, stargateTestOptions, [
  testStargateUSDTAum,
])

async function deployStargateUSDCStrategy() {
  return await deployStrategy("avalanche", "StargateUSDC")
}

async function deployStargateUSDTStrategy() {
  return await deployStrategy("avalanche", "StargateUSDT")
}

async function upgradeStargateUSDCStrategy() {
  return await upgradeStrategy("avalanche", "StargateUSDC")
}

async function upgradeStargateUSDTStrategy() {
  return await upgradeStrategy("avalanche", "StargateUSDT")
}

function testStargateUSDCAum() {
  describe("AUM - Stargate USDC Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("10", this.depositTokenDecimals),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const lpTokenContract = await ethers.getContractAt(StargateLPTokenABI, Stargate.usdcLPToken)
      const totalSupply = await lpTokenContract.totalSupply()
      const totalLiquidity = await lpTokenContract.totalLiquidity()
      const lpBalance = ethers.utils.parseUnits("10", this.depositTokenDecimals).mul(totalSupply).div(totalLiquidity)

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset.toLowerCase()).to.equal(Stargate.usdcLPToken.toLowerCase())
      expect(assetBalancesAfter[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset.toLowerCase()).to.equal(Stargate.usdcLPToken.toLowerCase())
      expect(assetValuationsAfter[0].valuation).to.approximately(
        ethers.utils.parseUnits("10", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("10", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("10", this.depositTokenDecimals).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("10", this.depositTokenDecimals).add(this.equityValuation))
      )
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      // The first user deposits.
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
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
          amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
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

      const lpTokenContract = await ethers.getContractAt(StargateLPTokenABI, Stargate.usdcLPToken)
      const totalSupply = await lpTokenContract.totalSupply()
      const totalLiquidity = await lpTokenContract.totalLiquidity()
      const lpBalance = ethers.utils.parseUnits("5", this.depositTokenDecimals).mul(totalSupply).div(totalLiquidity)

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset.toLowerCase()).to.equal(Stargate.usdcLPToken.toLowerCase())
      expect(assetBalancesAfter[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset.toLowerCase()).to.equal(Stargate.usdcLPToken.toLowerCase())
      expect(assetValuationsAfter[0].valuation).to.approximately(
        ethers.utils.parseUnits("5", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("5", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("5", this.depositTokenDecimals).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("5", this.depositTokenDecimals).add(this.equityValuation))
      )
    })
  })
}

function testStargateUSDCInitialize() {
  describe("Initialize - Stargate USDC Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      const Strategy = await ethers.getContractFactory("Stargate")

      await expect(
        upgrades.deployProxy(
          Strategy,
          [
            [
              this.investmentToken.address,
              Tokens.usdc,
              [
                this.depositFee,
                this.depositFeeParams,
                this.withdrawalFee,
                this.withdrawalFeeParams,
                this.performanceFee,
                this.performanceFeeParams,
                this.managementFee,
                this.managementFeeParams,
                this.feeReceiver,
                this.feeReceiverParams,
              ],
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              [],
            ],
            Stargate.router,
            Stargate.usdtPool,
            Stargate.lpStaking,
            Tokens.usdc,
            Stargate.stgToken,
            [TraderJoe.lbRouter, 1],
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(this.strategy, "InvalidStargateLpToken")
    })
  })
}

function testStargateUSDTAum() {
  describe("AUM - Stargate USDT Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("10", this.depositTokenDecimals),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const lpTokenContract = await ethers.getContractAt(StargateLPTokenABI, Stargate.usdtLPToken)
      const totalSupply = await lpTokenContract.totalSupply()
      const totalLiquidity = await lpTokenContract.totalLiquidity()
      const lpBalance = ethers.utils.parseUnits("10", this.depositTokenDecimals).mul(totalSupply).div(totalLiquidity)

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(Stargate.usdtLPToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(Stargate.usdtLPToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("10", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("10", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("10", this.depositTokenDecimals).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("10", this.depositTokenDecimals).add(this.equityValuation))
      )
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)

      // The first user deposits.
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
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
          amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
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

      const lpTokenContract = await ethers.getContractAt(StargateLPTokenABI, Stargate.usdtLPToken)
      const totalSupply = await lpTokenContract.totalSupply()
      const totalLiquidity = await lpTokenContract.totalLiquidity()
      const lpBalance = ethers.utils.parseUnits("5", this.depositTokenDecimals).mul(totalSupply).div(totalLiquidity)

      const assetBalancesAfter = await this.strategy.getAssetBalances()
      expect(assetBalancesAfter[0].asset.toLowerCase()).to.equal(Stargate.usdtLPToken.toLowerCase())
      expect(assetBalancesAfter[0].balance).to.approximately(
        lpBalance.add(assetBalancesBefore[0].balance),
        getErrorRange(lpBalance.add(assetBalancesBefore[0].balance))
      )

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      expect(assetValuationsAfter[0].asset.toLowerCase()).to.equal(Stargate.usdtLPToken.toLowerCase())
      expect(assetValuationsAfter[0].valuation).to.approximately(
        ethers.utils.parseUnits("5", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation),
        getErrorRange(ethers.utils.parseUnits("5", this.depositTokenDecimals).add(assetValuationsBefore[0].valuation))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("5", this.depositTokenDecimals).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("5", this.depositTokenDecimals).add(this.equityValuation))
      )
    })
  })
}

function testStargateUSDTInitialize() {
  describe("Initialize - Stargate USDT Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      const Strategy = await ethers.getContractFactory("Stargate")

      await expect(
        upgrades.deployProxy(
          Strategy,
          [
            [
              this.investmentToken.address,
              Tokens.usdc,
              [
                this.depositFee,
                this.depositFeeParams,
                this.withdrawalFee,
                this.withdrawalFeeParams,
                this.performanceFee,
                this.performanceFeeParams,
                this.managementFee,
                this.managementFeeParams,
                this.feeReceiver,
                this.feeReceiverParams,
              ],
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
              this.priceOracle,
              this.swapServiceProvider,
              this.swapServiceRouter,
              [],
            ],
            Stargate.router,
            Stargate.usdtPool,
            Stargate.lpStaking,
            Tokens.usdc,
            Stargate.stgToken,
            [TraderJoe.lbRouter, 1],
          ],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(this.strategy, "InvalidStargateLpToken")
    })
  })
}
