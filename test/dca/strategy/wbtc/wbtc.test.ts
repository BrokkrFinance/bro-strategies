import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { TokenAddrs } from "../../../helper/addresses"
import { deployUUPSUpgradeableContract, getTokenContract } from "../../../helper/contracts"
import { SwapServices } from "../../../helper/swaps"
import { currentBlockchainTime, setBlockchainTime, testDcaStrategy } from "../shared"

testDcaStrategy("WBTC DCA Strategy", deployWBTCDcaStrategy, [testWbtcDca])

async function deployWBTCDcaStrategy() {
  const signers = await ethers.getSigners()

  return await deployUUPSUpgradeableContract(await ethers.getContractFactory("WBTCBluechip"), [
    [
      [signers[1].address, 1000],
      signers[2].address,
      [TokenAddrs.usdc, 6],
      86400,
      (await currentBlockchainTime(ethers.provider)) + 86400,
      1000000,
      52,
      [SwapServices.traderjoe.provider, SwapServices.traderjoe.router],
      [TokenAddrs.usdc, TokenAddrs.btc],
      [TokenAddrs.btc, TokenAddrs.usdc],
    ],
    [TokenAddrs.btc, 8],
    [
      "0x39dE4e02F76Dbd4352Ec2c926D8d64Db8aBdf5b2",
      "0xfF6934aAC9C94E1C39358D4fDCF70aeca77D0AB0",
      "0xc09c12093b037866Bf68C9474EcDb5113160fBcE",
      "0x22d4002028f537599bE9f666d1c4Fa138522f9c8",
      19,
    ],
    [
      "0x22d4002028f537599bE9f666d1c4Fa138522f9c8",
      "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      "0x50b7545627a5162F82A992c33b87aDc75187B218",
    ],
    ["0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "0x50b7545627a5162F82A992c33b87aDc75187B218"],
  ])
}

async function testWbtcDca() {
  describe("WBTC DCA", async function () {
    it("should allow to make deposits", async function () {
      let initialEquity = (await this.strategy.equityValuation())[0]
      expect(initialEquity.totalDepositToken).to.equal("0")
      expect(initialEquity.totalBluechipToken).to.equal("0")

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("3000", 6))

      const feeReceiverBalanceBefore = await this.usdc.balanceOf(this.user0.address)
      const userBalanceBefore = await this.usdc.balanceOf(this.user3.address)

      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 9)

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(
        BigNumber.from("100000000").add(feeReceiverBalanceBefore).toString()
      )
      expect(await this.usdc.balanceOf(this.strategy.address)).to.equal("900000000")
      expect(await this.usdc.balanceOf(this.user3.address)).to.equal(
        userBalanceBefore.sub(BigNumber.from("1000000000"))
      )

      expect(await this.strategy.currentInvestQueueIndex()).to.equal(0)
      for (let i = 0; i < 9; i++) {
        expect(await this.strategy.getInvestAmountAt(i)).to.equal("100000000")
      }

      let depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)
      expect(depositorInfo.positions[0].depositAmount).to.equal("900000000")
      expect(depositorInfo.positions[0].amountSplit).to.equal(9)
      expect(depositorInfo.positions[0].investedAtHistoricalIndex).to.equal(0)

      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 9)

      // deposit with the same amount split should be merged into 1 one
      expect(await this.strategy.currentInvestQueueIndex()).to.equal(0)
      for (let i = 0; i < 9; i++) {
        expect(await this.strategy.getInvestAmountAt(i)).to.equal("200000000")
      }

      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)
      expect(depositorInfo.positions[0].depositAmount).to.equal("1800000000")
      expect(depositorInfo.positions[0].amountSplit).to.equal(9)
      expect(depositorInfo.positions[0].investedAtHistoricalIndex).to.equal(0)

      // deposit with different amount spllit should create second position
      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 1))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user3.address, "900000000", 1)

      expect(await this.strategy.getInvestAmountAt(0)).to.equal("1100000000")

      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(2)
      expect(depositorInfo.positions[1].depositAmount).to.equal("900000000")
      expect(depositorInfo.positions[1].amountSplit).to.equal(1)
      expect(depositorInfo.positions[1].investedAtHistoricalIndex).to.equal(0)
    })

    it("should allow to invest user deposits", async function () {
      await expect(this.strategy.canInvest()).to.be.reverted

      let currentTime = (await currentBlockchainTime(ethers.provider)) + 86400 + 1
      await setBlockchainTime(ethers.provider, currentTime)

      expect(await this.strategy.canInvest()).to.equal(false)

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      expect(await this.strategy.canInvest()).to.equal(true)

      const lastInvestmentTimestampBefore = await this.strategy.lastInvestmentTimestamp()

      await this.strategy.connect(this.user1).invest()
      expect(await this.strategy.canInvest()).to.equal(false)

      expect(await this.strategy.lastInvestmentTimestamp()).to.equal(
        lastInvestmentTimestampBefore.add(BigNumber.from("86400"))
      )

      expect(await this.strategy.currentDCAHistoryIndex()).to.equal(1)
      const [amountSpent, amountReceived] = await this.strategy.getHistoricalGaugeAt(0)
      expect(amountSpent.toString()).to.equal("100000000")

      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(amountReceived)

      expect(await this.strategy.currentInvestQueueIndex()).to.equal(1)
      expect(await this.strategy.getInvestAmountAt(0)).to.equal(0)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)
      expect(await this.strategy.canInvest()).to.equal(true)

      await this.strategy.connect(this.user1).invest()
      expect(await this.strategy.currentDCAHistoryIndex()).to.equal(2)

      const [amountSpentSecond, amountReceivedSecond] = await this.strategy.getHistoricalGaugeAt(1)
      expect(amountSpentSecond.toString()).to.equal("100000000")

      const totalExchangedBluechip = amountReceived.add(amountReceivedSecond)

      // withdraw bluechip from pool - contract should have it on the balance
      expect(await this.strategy.bluechipInvestmentState()).to.equal(0)

      await this.strategy.withdrawBluechipFromPool()
      this.btc = await getTokenContract(TokenAddrs.btc)
      expect(await this.btc.balanceOf(this.strategy.address)).to.equal(totalExchangedBluechip)
      expect(await this.strategy.bluechipInvestmentState()).to.equal(1)

      // reinvest back, tokens should be sent to master ptp
      await this.strategy.reInvestBluechipIntoPool()
      expect(await this.btc.balanceOf(this.strategy.address)).to.equal(BigNumber.from("0"))
      expect(await this.strategy.bluechipInvestmentState()).to.equal(0)
    })

    it("should allow to withdraw user deposits", async function () {
      this.btc = await getTokenContract(TokenAddrs.btc)

      let usdcBalanceBefore = await this.usdc.balanceOf(this.user3.address)
      let wbtcBalanceBefore = await this.btc.balanceOf(this.user3.address)

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // user should receive whole usdc deposit - nothing was exchanged
      let depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)

      await this.strategy.connect(this.user3).withdrawAll(false)

      let usdcBalanceAfter = await this.usdc.balanceOf(this.user3.address)
      let wbtcBalanceAfter = await this.btc.balanceOf(this.user3.address)

      expect(usdcBalanceBefore).to.equal(usdcBalanceAfter.add(BigNumber.from("100000000")))
      expect(wbtcBalanceBefore).to.equal(wbtcBalanceAfter)

      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(0)

      // test both deposit and bluechip withdrawal
      usdcBalanceBefore = await this.usdc.balanceOf(this.user3.address)
      wbtcBalanceBefore = await this.btc.balanceOf(this.user3.address)

      let currentTime = (await currentBlockchainTime(ethers.provider)) + 86400 + 1
      await setBlockchainTime(ethers.provider, currentTime)

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()
      const [_, amountReceived] = await this.strategy.getHistoricalGaugeAt(0)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(amountReceived)

      await this.strategy.connect(this.user3).withdrawAll(false)

      const [amountSpentAfter, amountReceivedAfter] = await this.strategy.getHistoricalGaugeAt(0)

      usdcBalanceAfter = await this.usdc.balanceOf(this.user3.address)
      wbtcBalanceAfter = await this.btc.balanceOf(this.user3.address)

      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))
      expect(amountReceivedAfter).to.equal(BigNumber.from("0"))
      expect(amountSpentAfter).to.equal(BigNumber.from("0"))
      expect(wbtcBalanceAfter).to.equal(wbtcBalanceBefore.add(amountReceived))

      // test both withdrawal with conversion
      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()

      wbtcBalanceBefore = await this.btc.balanceOf(this.user3.address)

      await this.strategy.connect(this.user3).withdrawAll(true)

      wbtcBalanceAfter = await this.btc.balanceOf(this.user3.address)

      expect(wbtcBalanceBefore).to.equal(wbtcBalanceAfter)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))

      // test only bluechip withdrwal
      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 1)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()

      usdcBalanceBefore = await this.usdc.balanceOf(this.user3.address)
      wbtcBalanceBefore = await this.btc.balanceOf(this.user3.address)

      const boughtBluechip = (await this.strategy.equityValuation())[0].totalBluechipToken

      await this.strategy.connect(this.user3).withdrawAll(false)

      usdcBalanceAfter = await this.usdc.balanceOf(this.user3.address)
      wbtcBalanceAfter = await this.btc.balanceOf(this.user3.address)

      expect(usdcBalanceBefore).to.equal(usdcBalanceAfter)
      expect(wbtcBalanceAfter).to.equal(wbtcBalanceBefore.add(boughtBluechip))
    })

    it("should properly calculate user bluechip asset share", async function () {
      this.btc = await getTokenContract(TokenAddrs.btc)

      let currentTime = (await currentBlockchainTime(ethers.provider)) + 86400 + 1
      await setBlockchainTime(ethers.provider, currentTime)

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      await this.usdc.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("1000", 6), 9)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()

      // both users should have same share 50/50
      const [amountSpentBefore, amountReceivedBefore] = await this.strategy.getHistoricalGaugeAt(0)

      await this.strategy.connect(this.user3).withdrawAll(false)

      const [amountSpentAfter, amountReceivedAfter] = await this.strategy.getHistoricalGaugeAt(0)
      let wbtcBalanceAfter = await this.btc.balanceOf(this.user3.address)

      expect(amountSpentAfter).to.equal(amountSpentBefore.div(BigNumber.from("2")))
      expect(amountReceivedAfter).to.equal(amountReceivedBefore.div(BigNumber.from("2")))
      expect(amountReceivedAfter).to.equal(wbtcBalanceAfter)

      // second user should withdraw his share
      await this.strategy.connect(this.user2).withdrawAll(false)

      const [amountSpentAfterSecond, amountReceivedAfterSecond] = await this.strategy.getHistoricalGaugeAt(0)
      expect(amountSpentAfterSecond).to.equal(BigNumber.from("0"))
      expect(amountReceivedAfterSecond).to.equal(BigNumber.from("0"))

      let wbtcBalanceAfterSecond = await this.btc.balanceOf(this.user2.address)
      expect(wbtcBalanceAfter).to.equal(wbtcBalanceAfterSecond)
    })

    it("should properly withdraw user funds on emergency exit", async function () {
      this.btc = await getTokenContract(TokenAddrs.btc)
      this.usdt = await getTokenContract(TokenAddrs.usdt)
      this.eth = await getTokenContract(TokenAddrs.eth)

      const emergencyDepositSwapPath = [TokenAddrs.usdc, TokenAddrs.usdt]
      const emergencyBluechipSwapPath = [TokenAddrs.btc, TokenAddrs.eth]

      let currentTime = (await currentBlockchainTime(ethers.provider)) + 86400 + 1
      await setBlockchainTime(ethers.provider, currentTime)

      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      await this.usdc.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("1000", 6), 9)

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()

      currentTime += 86400
      await setBlockchainTime(ethers.provider, currentTime)

      await this.strategy.connect(this.user1).invest()

      // swap usdc -> usdt; btc -> eth
      await this.strategy.emergencyWithdrawFunds(
        [TokenAddrs.usdt, 6],
        emergencyDepositSwapPath,
        [TokenAddrs.eth, 18],
        emergencyBluechipSwapPath
      )

      expect(await this.strategy.bluechipInvestmentState()).to.equal(2)

      await expect(this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)).to.be.revertedWith(
        "Strategy is emergency exited"
      )
      await expect(this.strategy.connect(this.user1).invest()).to.be.revertedWith("Strategy is emergency exited")

      expect(await this.usdc.balanceOf(this.strategy.address)).to.equal(BigNumber.from("0"))
      expect(await this.btc.balanceOf(this.strategy.address)).to.equal(BigNumber.from("0"))

      // user3 and user2 should receive half
      await this.strategy.connect(this.user3).withdrawAll(false)
      await this.strategy.connect(this.user2).withdrawAll(false)

      expect(await this.usdt.balanceOf(this.user3.address)).to.equal(await this.usdt.balanceOf(this.user2.address))
      expect(await this.eth.balanceOf(this.user3.address)).to.equal(await this.eth.balanceOf(this.user2.address))
    })

    it("should fail on too small amount", async function () {
      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))

      await expect(this.strategy.connect(this.user3).deposit("100", 1)).to.be.revertedWithCustomError(
        this.strategy,
        "TooSmallDeposit"
      )
    })

    it("should fail on position limit reached", async function () {
      await this.usdc.connect(this.user3).approve(this.strategy.address, ethers.utils.parseUnits("3000", 6))

      for (let i = 1; i <= 52; i++) {
        await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), i)
      }

      await expect(
        this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), 100)
      ).to.be.revertedWithCustomError(this.strategy, "PositionsLimitReached")
    })

    it("should fail on unauthorized invest access", async function () {
      await expect(this.strategy.connect(this.user3).invest()).to.be.revertedWith("Unauthorized")
    })
  })
}
