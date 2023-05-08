import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getTokenContract } from "../../../scripts/helper/helper"
import { getErrorRange } from "../../helper/utils"

getErrorRange
getTokenContract

export function testStrategyEmergencyExit() {
  describe("Emergency exit", async function () {
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
