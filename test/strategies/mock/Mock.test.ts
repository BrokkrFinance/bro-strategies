import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import Tokens from "../../../constants/avalanche/addresses/Tokens.json"
import Avalanche from "../../../constants/networks/Avalanche.json"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { WhaleAddrs } from "../../helper/addresses"
import { StrategyTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"

expect
BigNumber
ethers
deployStrategy
WhaleAddrs
testStrategy
Tokens

const mockTestOptions: StrategyTestOptions = {
  network: Avalanche,
  forkAt: 29197000,
  upgradeTo: "OwnableV2",
  runReapRewardExtra: false,
  runReapUninvestedReward: false,
}

testStrategy("Mock Strategy - Deploy", deployMockStrategy, mockTestOptions, [testPerformanceFee])

async function deployMockStrategy() {
  let strategy = await deployStrategy("avalanche", "MockStrategy")

  // setting up FreeMoneyProvider
  const FreeMoneyProvider = await ethers.getContractFactory("FreeMoneyProvider")
  const freeMoneyProvider = await FreeMoneyProvider.deploy()
  await strategy.setFreeMoneyProvider(freeMoneyProvider.address)

  // transfering deposit token to FreeMoneyProvider and to the strategy
  let impersonatedSigner = await ethers.getImpersonatedSigner(WhaleAddrs.avalanche.usdc)
  let usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", Tokens.usdc)
  await usdc.connect(impersonatedSigner).transfer(freeMoneyProvider.address, ethers.utils.parseUnits("30000", 6))
  await usdc.connect(impersonatedSigner).transfer(strategy.address, ethers.utils.parseUnits("30000", 6))

  return strategy
}

function testPerformanceFee() {
  describe("Mock strategy specific tests", async function () {
    it("performance fee handling", async function () {
      // should fail when the non-owner tries to set the performance fee
      await expect(this.strategy.connect(this.user0).setPerformanceFee(0, [])).to.be.reverted

      // should fail when the non-owner tries to take performance fee
      await expect(this.strategy.connect(this.user0).takePerformanceFee([])).to.be.reverted

      // taking zero performance fee from an uninvested strategy
      await expect(this.strategy.connect(this.owner).setPerformanceFee(0, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(0)

      // taking 20% performance fee from an uninvested strategy
      await expect(this.strategy.connect(this.owner).setPerformanceFee(20000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(0)

      // user0 deposits 10000 into the strategy
      let user0UsdcBalanceBeforeInvestment: BigNumber = await this.depositToken.balanceOf(this.user0.address)
      await this.depositToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10000", 6))
      await this.strategy
        .connect(this.user0)
        .deposit(ethers.utils.parseUnits("10000", 6), BigNumber.from(0), this.user0.address, [])

      // user1 deposits 10000 into the strategy
      let user1UsdcBalanceBeforeInvestment: BigNumber = await this.depositToken.balanceOf(this.user1.address)
      await this.depositToken.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("10000", 6))
      await this.strategy
        .connect(this.user1)
        .deposit(ethers.utils.parseUnits("10000", 6), BigNumber.from(0), this.user1.address, [])
      let investmentTokenSupplyAfterInvestment = await this.strategy.getInvestmentTokenSupply()
      let equityAfterInvestment = await this.strategy.getEquityValuation(false, false)

      // strategy will yield 20% (token price 1.0 -> 1.2, high watermark: 1.0)
      this.strategy.changeBalanceByPercentage(120000)
      // taking 10% performance fee on 20.000 -> 24.000 performance
      await expect(this.strategy.connect(this.owner).setPerformanceFee(10000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        ethers.utils.parseUnits("400", 6),
        BigNumber.from(10)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(investmentTokenSupplyAfterInvestment)
      expect(await this.strategy.getEquityValuation(false, false)).to.be.approximately(
        ethers.utils.parseUnits("23600", 6),
        BigNumber.from(10)
      )

      // strategy balance increase by 2.400 from 23.600 -> 26.000 (token price price 1.2 -> 1.3, high watermark: 1.3)
      await this.strategy.increaseBalanceByAmount(ethers.utils.parseUnits("2400", 6))
      // taking 5% performance fee on 24.000 -> 26.000 performance
      await expect(this.strategy.connect(this.owner).setPerformanceFee(5000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        ethers.utils.parseUnits("500", 6),
        BigNumber.from(10)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(investmentTokenSupplyAfterInvestment)
      expect(await this.strategy.getEquityValuation(false, false)).to.be.approximately(
        ethers.utils.parseUnits("25900", 6),
        BigNumber.from(10)
      )

      // user1 withdraws everything
      // set withdrawal fee to 10%
      await expect(this.strategy.connect(this.owner).setWithdrawalFee(10000, [])).not.to.be.reverted
      let withdrawAmount = investmentTokenSupplyAfterInvestment / 2
      await expect(this.investmentToken.connect(this.user1).approve(this.strategy.address, withdrawAmount)).not.to.be
        .reverted
      await expect(
        this.strategy.connect(this.user1).withdraw(withdrawAmount, BigNumber.from(0), this.user1.address, [])
      ).not.to.be.reverted
      let user1UsdcBalanceAfterInvestment = await this.depositToken.balanceOf(this.user1.address)
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        ethers.utils.parseUnits("1795", 6),
        BigNumber.from(10)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(investmentTokenSupplyAfterInvestment / 2)
      expect(await this.strategy.getEquityValuation(false, false)).to.be.approximately(
        ethers.utils.parseUnits("12950", 6),
        BigNumber.from(10)
      )
      expect(user1UsdcBalanceAfterInvestment).to.be.approximately(
        user1UsdcBalanceBeforeInvestment.add(ethers.utils.parseUnits("1655", 6)),
        BigNumber.from(10)
      )

      // strategy balance decreases from 12.950 -> 11.000 (token price 1.295 -> 1.1, high watermark: 1.3)
      await this.strategy.decreaseBalanceByAmount(ethers.utils.parseUnits("1950", 6))
      // taking 10% performance fee on 12.950 -> 11.000  performance
      await expect(this.strategy.connect(this.owner).setPerformanceFee(10000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        ethers.utils.parseUnits("1795", 6),
        BigNumber.from(10)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(investmentTokenSupplyAfterInvestment / 2)
      expect(await this.strategy.getEquityValuation(false, false)).to.be.approximately(
        ethers.utils.parseUnits("11000", 6),
        BigNumber.from(10)
      )

      // strategy balance increases from 11.000 -> 15.000 (token price 1.1 -> 1.5, high watermark: 1.5)
      await this.strategy.increaseBalanceByAmount(ethers.utils.parseUnits("4000", 6))
      // taking 10% performance fee on 11.000 -> 15.000  performance
      await expect(this.strategy.connect(this.owner).setPerformanceFee(10000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takePerformanceFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        ethers.utils.parseUnits("1995", 6),
        BigNumber.from(10)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(investmentTokenSupplyAfterInvestment / 2)
      expect(await this.strategy.getEquityValuation(false, false)).to.be.approximately(
        ethers.utils.parseUnits("14800", 6),
        BigNumber.from(10)
      )
    })
  })
}
