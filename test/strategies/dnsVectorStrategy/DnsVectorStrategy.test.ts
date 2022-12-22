import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import Tokens from "../../../constants/addresses/Tokens.json"
import Vector from "../../../constants/addresses/Vector.json"
import { deployStrategy, upgradeStrategy } from "../../../scripts/helper/contract"
import { TestOptions } from "../../helper/interfaces/options"
import { getErrorRange } from "../../helper/utils"
import { testStrategy } from "../Strategy.test"

const dnsVectorTestOptions: TestOptions = {
  upgradeTo: "RoleableV2",
  runReapRewardExtra: false,
}

testStrategy("Dns Vector Strategy - Deploy", deployDnsStrategy, dnsVectorTestOptions, [
  testAum,
  testCollaterizationAndDeltaNeutrality,
  testRebalanceSafetyLimits,
])
testStrategy("Dns Vector Strategy - Upgrade After Deploy", upgradeDnsStrategy, dnsVectorTestOptions, [
  testAum,
  testCollaterizationAndDeltaNeutrality,
  testRebalanceSafetyLimits,
])

async function checkProperCollateralization(strategy: any) {
  const lowCollaterizationRatio = await strategy.getInverseCollateralRatio(true, false)
  const highCollaterizationRatio = await strategy.getInverseCollateralRatio(false, false)
  const expectCollaterizationRatio = await strategy.getCombinedSafetyFactor()

  // check if lowCollaterizationRatio and expectCollaterizationRatio are within
  // 1% error range of expectCollaterizationRatio
  expect(lowCollaterizationRatio).to.be.approximately(
    expectCollaterizationRatio,
    getErrorRange(lowCollaterizationRatio, BigNumber.from(1), BigNumber.from(100))
  )
  expect(highCollaterizationRatio).to.be.approximately(
    expectCollaterizationRatio,
    getErrorRange(highCollaterizationRatio, BigNumber.from(1), BigNumber.from(100))
  )
}

async function checkDeltaNeutrality(strategy: any) {
  const aaveDebt = await strategy.getAaveDebt()
  const poolDebt = await strategy.getPoolDebt()

  expect(aaveDebt).to.be.approximately(poolDebt, getErrorRange(aaveDebt, BigNumber.from(1), BigNumber.from(100)))
}

async function checkEquityValuationAndInvestmentTokenSupply(initialState: StateSnapshot, currentState: StateSnapshot) {
  // investment token supply should not change
  expect(initialState.investmentTokenSupply).to.be.equal(currentState.investmentTokenSupply)

  // equity valuation should not change too much
  expect(initialState.lowEquityValuation).to.be.approximately(
    currentState.lowEquityValuation,
    getErrorRange(initialState.lowEquityValuation)
  )
  expect(initialState.highEquityValuation).to.be.approximately(
    currentState.highEquityValuation,
    getErrorRange(initialState.highEquityValuation)
  )
}

type Balance = {
  asset: string
  balance: BigNumber
}

type Valuation = {
  asset: string
  valuation: BigNumber
}

type StateSnapshot = {
  aaveSupply: BigNumber
  aaveDebt: BigNumber
  poolDebt: BigNumber
  lpTokenAmount: BigNumber
  lowCollaterizationRatio: BigNumber
  highCollaterizationRatio: BigNumber
  lowEquityValuation: BigNumber
  highEquityValuation: BigNumber
  investmentTokenSupply: BigNumber
  assetBalances: Balance[]
  lowAssetValuations: Valuation[]
  liabilityBalances: Balance[]
  lowLiabilityValuations: Valuation[]
}

async function getStateSnapshot(strategy: any): Promise<StateSnapshot> {
  return {
    aaveSupply: await strategy.getAaveSupply(),
    aaveDebt: await strategy.getAaveDebt(),
    poolDebt: await strategy.getPoolDebt(),
    lpTokenAmount: (await strategy.getAssetBalances())[1].balance,
    lowCollaterizationRatio: await strategy.getInverseCollateralRatio(true, false),
    highCollaterizationRatio: await strategy.getInverseCollateralRatio(false, false),
    lowEquityValuation: await strategy.getEquityValuation(false, false),
    highEquityValuation: await strategy.getEquityValuation(true, false),
    investmentTokenSupply: await strategy.getInvestmentTokenSupply(),
    assetBalances: await strategy.getAssetBalances(),
    lowAssetValuations: await strategy.getAssetValuations(false, false),
    liabilityBalances: await strategy.getLiabilityBalances(),
    lowLiabilityValuations: await strategy.getLiabilityValuations(false, false),
  }
}

function testRebalanceSafetyLimits() {
  describe("Rebalance function's safety limit test", async function () {
    it("repay debt call should fail, if the limit is set too high", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const repayDebtAmount = initialState.lpTokenAmount.div(10)
      await expect(
        this.strategy.connect(this.maintainerMember).repayDebt(repayDebtAmount, [], ethers.utils.parseUnits("100", 6))
      ).to.be.reverted
    })

    it("repay debt call should succeed, if the limit is set too a reasonable level", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const repayDebtAmount = initialState.lpTokenAmount.div(10)
      await expect(
        this.strategy.connect(this.maintainerMember).repayDebt(repayDebtAmount, [], ethers.utils.parseUnits("99", 6))
      ).to.not.be.reverted
    })

    it("increase debt call should fail, if the limit is set too high", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const increaseDebtAmount = initialState.aaveDebt.div(10)
      await expect(
        this.strategy
          .connect(this.maintainerMember)
          .increaseDebt(increaseDebtAmount, [], ethers.utils.parseUnits("100", 6))
      ).to.be.reverted
    })

    it("increase debt call should succeed, if the limit is set too a reasonable level", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const increaseDebtAmount = initialState.aaveDebt.div(10)
      await expect(
        this.strategy
          .connect(this.maintainerMember)
          .increaseDebt(increaseDebtAmount, [], ethers.utils.parseUnits("99", 6))
      ).to.not.be.reverted
    })

    it("decrease supply call should fail, if the limit is set too high", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const decreaseSupplyAmount = ethers.utils.parseUnits("3", 6)
      await expect(
        this.strategy
          .connect(this.maintainerMember)
          .decreaseSupply(decreaseSupplyAmount, [], ethers.utils.parseUnits("100", 6))
      ).to.be.reverted
    })

    it("decrease supply call should succeed, if the limit is set too a reasonable level", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      const decreaseSupplyAmount = ethers.utils.parseUnits("3", 6)
      await expect(
        this.strategy
          .connect(this.maintainerMember)
          .decreaseSupply(decreaseSupplyAmount, [], ethers.utils.parseUnits("99", 6))
      ).to.not.be.reverted
    })
  })
}

function testCollaterizationAndDeltaNeutrality() {
  describe("Collaterization and delta neutrailty test", async function () {
    it("check collaterization and delta neutrailty after repay debt call", async function () {
      // single deposit by user0
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      // repay debt which involves
      // 1. withdraw lp tokens from vector
      // 2. burn lp tokens
      // 3. convert borrow token to deposit token
      // 4. repay debt
      const repayDebtAmount = initialState.lpTokenAmount.div(10)
      await this.strategy.connect(this.maintainerMember).repayDebt(repayDebtAmount, [], BigNumber.from(0))
      const currentState: StateSnapshot = await getStateSnapshot(this.strategy)

      // check delta neutrality: it should no longer be delta neutral
      expect(currentState.aaveDebt).to.be.within(
        initialState.aaveDebt.mul(75).div(100),
        initialState.aaveDebt.mul(83).div(100)
      )
      expect(currentState.poolDebt).to.be.within(initialState.poolDebt.mul(86).div(100), initialState.poolDebt)

      // check collateral ratio: it should decrease
      expect(currentState.lowCollaterizationRatio).to.be.below(initialState.lowCollaterizationRatio)
      expect(currentState.highCollaterizationRatio).to.be.below(initialState.highCollaterizationRatio)

      // check aave supply: it should not change
      expect(currentState.aaveSupply).to.be.equal(initialState.aaveSupply)

      // checking equity valuation and investment token supply
      checkEquityValuationAndInvestmentTokenSupply(initialState, currentState)
    })

    it("check collaterization and delta neutrailty after incease debt call", async function () {
      // single deposit by user0
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      // increase debt which involves
      // 1. borrow more debt
      // 2. convert debt to deposit currency
      // 3. reinvest
      const increaseDebtAmount = initialState.aaveDebt.div(10)
      await this.strategy.connect(this.maintainerMember).increaseDebt(increaseDebtAmount, [], BigNumber.from(0))
      const currentState: StateSnapshot = await getStateSnapshot(this.strategy)

      // check delta neutrality: it should no longer be delta neutral
      expect(currentState.aaveDebt).to.be.above(initialState.aaveDebt.add(increaseDebtAmount))
      expect(currentState.poolDebt).to.be.above(initialState.poolDebt)
      expect(currentState.poolDebt).to.be.below(initialState.poolDebt.mul(105).div(100))

      // check collateral ratio: it should increase
      expect(currentState.lowCollaterizationRatio).to.be.above(initialState.lowCollaterizationRatio)
      expect(currentState.highCollaterizationRatio).to.be.above(initialState.highCollaterizationRatio)

      // check aave supply: it should increase due to reinvestment
      expect(currentState.aaveSupply).to.be.above(initialState.aaveSupply)

      // checking equity valuation and investment token supply
      checkEquityValuationAndInvestmentTokenSupply(initialState, currentState)
    })

    it("check collaterization and delta neutrailty after decrease supply call", async function () {
      // single deposit by user0
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
      const initialState: StateSnapshot = await getStateSnapshot(this.strategy)

      // decrease collateral by 3 units and reinvest
      const decreaseSupplyAmount = ethers.utils.parseUnits("3", 6)
      await this.strategy.connect(this.maintainerMember).decreaseSupply(decreaseSupplyAmount, [], BigNumber.from(0))
      const currentState: StateSnapshot = await getStateSnapshot(this.strategy)

      // check delta neutrality: it should not be affected
      await checkDeltaNeutrality(this.strategy)

      // check collateral ratio: it should increase
      expect(currentState.lowCollaterizationRatio).to.be.above(initialState.lowCollaterizationRatio)
      expect(currentState.highCollaterizationRatio).to.be.above(initialState.highCollaterizationRatio)

      // check aave debt: it should be increased due to the reinvestment
      expect(currentState.aaveDebt).to.be.above(initialState.aaveDebt)

      // check aave supply: it should be below the initial supply, and slightly above
      // 'initialAaveSupply - 3 units' due to the reinvestment
      expect(currentState.aaveSupply).to.be.below(initialState.aaveSupply)
      expect(currentState.aaveSupply).to.be.above(initialState.aaveSupply.sub(decreaseSupplyAmount))

      // checking equity valuation and investment token supply
      checkEquityValuationAndInvestmentTokenSupply(initialState, currentState)
    })

    it("check collaterization and delta neutrailty after deposit and withdrawal", async function () {
      // single deposit by user0
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // checking proper collateralization and delta neutrality
      await checkProperCollateralization(this.strategy)
      await checkDeltaNeutrality(this.strategy)

      // single deposit by user1
      await this.investHelper
        .deposit(this.strategy, this.user1, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // checking proper collateralization and delta neutrality
      await checkProperCollateralization(this.strategy)
      await checkDeltaNeutrality(this.strategy)

      // partial withdrawal by user0
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("70", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // checking proper collateralization and delta neutrality
      await checkProperCollateralization(this.strategy)
      await checkDeltaNeutrality(this.strategy)

      // partial withdrawal by user1
      await this.investHelper
        .deposit(this.investable, this.user1, {
          amount: ethers.utils.parseUnits("70", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // checking proper collateralization and delta neutrality
      await checkProperCollateralization(this.strategy)
      await checkDeltaNeutrality(this.strategy)
    })
  })
}

function testAum() {
  describe("AUM - Dns Strategy Specific", async function () {
    it("should succeed after a single deposit", async function () {
      await this.investHelper
        .deposit(this.strategy, this.user0, {
          amount: ethers.utils.parseUnits("100", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const state: StateSnapshot = await getStateSnapshot(this.strategy)

      // checking assets
      let expectedAssets = [{ asset: Tokens.aUsdc }, { asset: Vector.vectorAvaxUsdcStakingToken }]
      for (const [i, expectedAsset] of expectedAssets.entries()) {
        expect(expectedAsset.asset.toLowerCase()).to.be.equal(state.assetBalances[i].asset.toLowerCase())
        expect(expectedAsset.asset.toLowerCase()).to.be.equal(state.lowAssetValuations[i].asset.toLowerCase())
      }

      // checking liabilities
      let expectedLiabilities = [{ asset: Tokens.vWavax }]
      for (const [i, expectedLiability] of expectedLiabilities.entries()) {
        expect(expectedLiability.asset.toLowerCase()).to.be.equal(state.liabilityBalances[i].asset.toLowerCase())
        expect(expectedLiability.asset.toLowerCase()).to.be.equal(state.lowLiabilityValuations[i].asset.toLowerCase())
      }
    })
  })
}

async function deployDnsStrategy() {
  return await deployStrategy("DnsVector")
}

async function upgradeDnsStrategy() {
  return upgradeStrategy("DnsVector")
}
