import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getTokenContract } from "../../../scripts/helper/helper"
import { getErrorRange } from "../../helper/utils"

getErrorRange
getTokenContract

export function testStrategyWithdraw() {
  describe("Withdrawal", async function () {
    it("should allow to withdraw user deposits for a single user", async function () {
      let depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      let bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)

      ///////////// Test 1 - withdraw right after deposit (without the contract ever inveseted

      // deposit 1000 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // check user depositor info
      let depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)

      // withdraw all deposited money without the contract ever investing
      await this.strategy.connect(this.user3).withdrawAll(false)

      // balances should match the initial balances after considering fees
      let depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      let bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(depositTokenBalanceBefore).to.equal(depositTokenBalanceAfter.add(BigNumber.from("100000000")))
      expect(bluechipBalanceBefore).to.equal(bluechipTokenBalanceAfter)

      // check that the user depositor info is empty
      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(0)

      ///////////// Test 2 - withdraw after the contract invested

      depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)

      // deposit 1000 depositToken into 9 slots
      await mine(86401)
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // invest and check global queues
      await mine(86400)
      await this.strategy.connect(this.user1).invest()
      const [_, amountReceived] = await this.strategy.getHistoricalGaugeAt(0)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(amountReceived)

      // withdraw
      await this.strategy.connect(this.user3).withdrawAll(false)

      // check global queues and user balances after withdrawal
      const [amountSpentAfter, amountReceivedAfter] = await this.strategy.getHistoricalGaugeAt(0)
      depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))
      expect(amountReceivedAfter).to.equal(BigNumber.from("0"))
      expect(amountSpentAfter).to.equal(BigNumber.from("0"))
      expect(bluechipTokenBalanceAfter).to.equal(bluechipBalanceBefore.add(amountReceived))

      ///////////// Test 3 - withdraw and convert bluechip

      // deposit 1000 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // invest
      await mine(86400)
      await this.strategy.connect(this.user1).invest()

      // check user balances after withdrawal
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)
      await this.strategy.connect(this.user3).withdrawAll(true)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(bluechipBalanceBefore).to.equal(bluechipTokenBalanceAfter)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))

      /////////// Test 4 - withdraw only bluechip

      // deposit 1 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), 1)

      // invest
      await mine(86400)
      await this.strategy.connect(this.user1).invest()

      // store user balances before withdrawal
      depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)
      const boughtBluechip = (await this.strategy.equityValuation())[0].totalBluechipToken

      // withdraw
      await this.strategy.connect(this.user3).withdrawAll(false)

      // check user balances after withdrawal
      depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(depositTokenBalanceBefore).to.equal(depositTokenBalanceAfter)
      expect(bluechipTokenBalanceAfter).to.equal(bluechipBalanceBefore.add(boughtBluechip))
    })

    it("should properly withdraw user funds on emergency exit", async function () {
      const depositExitToken = this.testConfig.emergency.depositExitPath.slice(-1)[0]
      const bluechipExitToken = this.testConfig.emergency.bluechipExitPath.slice(-1)[0]
      const depositExitTokenContract = await getTokenContract(depositExitToken)
      const bluechipExitTokenContract = await getTokenContract(bluechipExitToken)

      const emergencyDepositSwapPath = this.testConfig.emergency.depositExitPath
      const emergencyBluechipSwapPath = this.testConfig.emergency.bluechipExitPath

      await mine(86401)

      // user3 deposits 100 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("100", 6), 9)

      // user2 deposits 100 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user2)
        .approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("100", 6), 9)

      await mine(86400)

      // invest
      await this.strategy.connect(this.user1).invest()

      await mine(86400)

      // invest
      await this.strategy.connect(this.user1).invest()

      // swap deposit currency -> deposit exit currency, and swap bluechip -> bluechip exit currency
      await this.strategy.emergencyWithdrawFunds(
        [depositExitToken, this.testConfig.emergency.depositExitTokenDigits],
        emergencyDepositSwapPath,
        this.testConfig.emergency.depositExitBins,
        [bluechipExitToken, this.testConfig.emergency.bluechipExitTokenDigits],
        emergencyBluechipSwapPath,
        this.testConfig.emergency.bluechipExitBins
      )

      // check state after emergency fund withrawal
      expect(await this.strategy.bluechipInvestmentState()).to.equal(2)

      // cannot invest into emergency exited fund
      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("100", 6), 9)).to.be.revertedWith(
        "Strategy is emergency exited"
      )
      await expect(this.strategy.connect(this.user1).invest()).to.be.revertedWith("Strategy is emergency exited")

      // no more funds hold in deposit currency and bluechip currency
      expect(await this.depositTokenContract.balanceOf(this.strategy.address)).to.equal(BigNumber.from("0"))
      expect(await this.bluechipTokenContract.balanceOf(this.strategy.address)).to.equal(BigNumber.from("0"))

      // user3 and user2 should both receive 50% of the total funds
      await this.strategy.connect(this.user3).withdrawAll(false)
      await this.strategy.connect(this.user2).withdrawAll(false)

      // even split for the deposit asset
      const user3DepositExitTokenBalance = await depositExitTokenContract.balanceOf(this.user3.address)
      const user2DepositExitTokenBalance = await depositExitTokenContract.balanceOf(this.user2.address)
      expect(user3DepositExitTokenBalance).to.be.approximately(
        user2DepositExitTokenBalance,
        getErrorRange(BigNumber.from(user3DepositExitTokenBalance), BigNumber.from(1), BigNumber.from(10000))
      )

      // even split for the bluechip asset
      const user3BluechipExitTokenBalance = await bluechipExitTokenContract.balanceOf(this.user3.address)
      const user2BluechipExitTokenBalance = await bluechipExitTokenContract.balanceOf(this.user2.address)
      expect(user3BluechipExitTokenBalance).to.be.approximately(
        user2BluechipExitTokenBalance,
        getErrorRange(BigNumber.from(user3BluechipExitTokenBalance), BigNumber.from(1), BigNumber.from(10000))
      )
    })
  })
}
