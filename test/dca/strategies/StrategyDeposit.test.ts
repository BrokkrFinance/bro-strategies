import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"

ethers
expect

export function testStrategyDeposit() {
  describe("Deposit", async function () {
    it("should allow to make deposits for a single user", async function () {
      let initialEquity = (await this.strategy.equityValuation())[0]
      expect(initialEquity.totalDepositToken).to.equal("0")
      expect(initialEquity.totalBluechipToken).to.equal("0")

      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("3000", 6))

      // deposit 1000 depositToken into 9 slots and checking deposit events
      const feeReceiverBalanceBefore = await this.depositTokenContract.balanceOf(this.user0.address)
      const userBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 9)

      // check depositToken balance increase for fee receiver, strategy and depositor
      expect(await this.depositTokenContract.balanceOf(this.user0.address)).to.equal(
        BigNumber.from("100000000").add(feeReceiverBalanceBefore).toString()
      )
      expect(await this.depositTokenContract.balanceOf(this.strategy.address)).to.equal("900000000")
      expect(await this.depositTokenContract.balanceOf(this.user3.address)).to.equal(
        userBalanceBefore.sub(BigNumber.from("1000000000"))
      )

      // each slot should have 100 depositToken
      expect(await this.strategy.currentInvestQueueIndex()).to.equal(0)
      for (let i = 0; i < 9; i++) {
        expect(await this.strategy.getInvestAmountAt(i)).to.equal("100000000")
      }

      // check depositors positions
      let depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)
      expect(depositorInfo.positions[0].depositAmount).to.equal("900000000")
      expect(depositorInfo.positions[0].amountSplit).to.equal(9)
      expect(depositorInfo.positions[0].investedAtHistoricalIndex).to.equal(0)

      // deposit with the same amount (split should be merged into 1 one)
      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 9)

      // each slot should have 200 depositToken
      expect(await this.strategy.currentInvestQueueIndex()).to.equal(0)
      for (let i = 0; i < 9; i++) {
        expect(await this.strategy.getInvestAmountAt(i)).to.equal("200000000")
      }

      // split should be merged into 1 one
      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)
      expect(depositorInfo.positions[0].depositAmount).to.equal("1800000000")
      expect(depositorInfo.positions[0].amountSplit).to.equal(9)
      expect(depositorInfo.positions[0].investedAtHistoricalIndex).to.equal(0)

      // deposit with different amount (split should create second position)
      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 1))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 1)

      expect(await this.strategy.getInvestAmountAt(0)).to.equal("1100000000")

      // split should create second position
      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(2)
      expect(depositorInfo.positions[1].depositAmount).to.equal("900000000")
      expect(depositorInfo.positions[1].amountSplit).to.equal(1)
      expect(depositorInfo.positions[1].investedAtHistoricalIndex).to.equal(0)
    })

    it("should allow to make deposits for multiple users", async function () {
      await mine(86401)

      // deposit 10 depositToken into 9 slots as user3
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("10", 6), 9)

      // deposit 10 depositToken into 9 slots as user2
      await this.depositTokenContract
        .connect(this.user2)
        .approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("10", 6), 9)

      // invest
      await mine(86400)
      await this.strategy.connect(this.user1).invest()

      // user3 withdraws all
      const [totalGaugeAmountSpentBefore, totalGaugeAmountReceivedBefore] = await this.strategy.getHistoricalGaugeAt(0)
      await this.strategy.connect(this.user3).withdrawAll(false)

      // check user3 balance and the global queues
      const [totalGaugeAmountSpentAfter, totalGaugeAmountReceivedAfter] = await this.strategy.getHistoricalGaugeAt(0)
      let bluechipBalanceUser3AfterWithdrawal = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(totalGaugeAmountSpentAfter).to.equal(totalGaugeAmountSpentBefore.div(BigNumber.from("2")))
      const roundingError = totalGaugeAmountReceivedBefore.mod(2)
      expect(totalGaugeAmountReceivedAfter).to.equal(
        totalGaugeAmountReceivedBefore.add(roundingError).div(BigNumber.from("2"))
      )
      expect(totalGaugeAmountReceivedAfter).to.equal(bluechipBalanceUser3AfterWithdrawal.add(roundingError))

      // user2 withdraws all
      await this.strategy.connect(this.user2).withdrawAll(false)

      // check user2 balance and the global queues
      const [totalGaugeAmountSpentAfterSecond, totalGaugeAmountReceivedAfterSecond] =
        await this.strategy.getHistoricalGaugeAt(0)
      expect(totalGaugeAmountSpentAfterSecond).to.equal(BigNumber.from("0"))
      expect(totalGaugeAmountReceivedAfterSecond).to.equal(BigNumber.from("0"))
      let bluechipBalanceUser3AfterWithdrawalSecond = await this.bluechipTokenContract.balanceOf(this.user2.address)
      expect(bluechipBalanceUser3AfterWithdrawal.add(roundingError)).to.equal(bluechipBalanceUser3AfterWithdrawalSecond)
    })

    it("should allow to invest user deposits for a single user", async function () {
      await expect(this.strategy.canInvest()).to.be.reverted

      await mine(86400)

      expect(await this.strategy.canInvest()).to.equal(false)

      // deposit 1000 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // advance time and check if investment method can be called
      await mine(86400)
      expect(await this.strategy.canInvest()).to.equal(true)

      // invest into the strategy and check if investment method can be called afterwards
      const lastInvestmentTimestampBefore = await this.strategy.lastInvestmentTimestamp()
      await this.strategy.connect(this.user1).invest()
      expect(await this.strategy.canInvest()).to.equal(false)
      expect(await this.strategy.lastInvestmentTimestamp()).to.equal(
        lastInvestmentTimestampBefore.add(BigNumber.from("86400"))
      )

      // check the state of the global queues
      expect(await this.strategy.currentDCAHistoryIndex()).to.equal(1)
      const [amountSpent, amountReceived] = await this.strategy.getHistoricalGaugeAt(0)
      expect(amountSpent.toString()).to.equal("100000000")
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(amountReceived)
      expect(await this.strategy.currentInvestQueueIndex()).to.equal(1)
      expect(await this.strategy.getInvestAmountAt(0)).to.equal(0)

      // advance time, so investment can be made again
      await mine(86400)
      expect(await this.strategy.canInvest()).to.equal(true)

      // check the state of the global queues
      await this.strategy.connect(this.user1).invest()
      expect(await this.strategy.currentDCAHistoryIndex()).to.equal(2)
      const [amountSpentSecond, amountReceivedSecond] = await this.strategy.getHistoricalGaugeAt(1)
      expect(amountSpentSecond.toString()).to.equal("100000000")
      const totalExchangedBluechip = amountReceived.add(amountReceivedSecond)

      // withdraw bluechip from pool
      // check that the contract should have the bluechips on the balance
      expect(await this.strategy.bluechipInvestmentState()).to.equal(0)
      await this.strategy.withdrawBluechipFromPool()
      expect(await this.bluechipTokenContract.balanceOf(this.strategy.address)).to.equal(totalExchangedBluechip)
      expect(await this.strategy.bluechipInvestmentState()).to.equal(1)

      // reinvest the bluechips back
      await this.strategy.reInvestBluechipIntoPool()
      expect(await this.bluechipTokenContract.balanceOf(this.strategy.address)).to.equal(totalExchangedBluechip)
      expect(await this.strategy.bluechipInvestmentState()).to.equal(0)
    })
  })
}
