import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getErrorRange } from "../helper/utils"

BigNumber
expect
ethers
getErrorRange

export function testStrategyFee() {
  describe("Fee", async function () {
    it("management fee handling", async function () {
      const initialAccumulatedFee = await this.strategy.getCurrentAccumulatedFee()
      const initialEquityValuation = await this.strategy.getEquityValuation(false, false)
      const initialInvestmentTokenSupply = await this.strategy.getInvestmentTokenSupply()

      // should fail when the non-owner tries to set the management fee
      await expect(this.strategy.connect(this.user0).setManagementFee(0, [])).to.be.reverted

      // should fail when the non-owner tries to take management fee
      await expect(this.strategy.connect(this.user0).takeManagementFee([])).to.be.reverted

      if (initialEquityValuation == 0) {
        // taking zero management fee from an uninvested strategy
        await expect(this.strategy.connect(this.owner).setManagementFee(0, [])).not.to.be.reverted
        await expect(this.strategy.connect(this.owner).takeManagementFee([])).not.to.be.reverted
        expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(initialAccumulatedFee)

        // taking 20% management fee from an uninvested strategy
        await expect(this.strategy.connect(this.owner).setManagementFee(20000, [])).not.to.be.reverted
        await expect(this.strategy.connect(this.owner).takeManagementFee([])).not.to.be.reverted
        expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(initialAccumulatedFee)
      }

      // user0 deposits 10000 into the strategy
      let user0UsdcBalanceBeforeInvestment = await this.depositToken.balanceOf(this.user0.address)
      await this.depositToken
        .connect(this.user0)
        .approve(this.strategy.address, ethers.utils.parseUnits("10", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user0)
        .deposit(ethers.utils.parseUnits("10", this.depositTokenDecimals), BigNumber.from(0), this.user0.address, [])
      const investmentTokenSupplyAfterInvestment = await this.strategy.getInvestmentTokenSupply()
      let investmentTokenSupplyIncrement = investmentTokenSupplyAfterInvestment.sub(initialInvestmentTokenSupply)
      let equityValuationAfterInvestment = await this.strategy.getEquityValuation(false, false)

      // taking zero management fee from an invested strategy
      await expect(this.strategy.connect(this.owner).setManagementFee(0, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takeManagementFee([])).not.to.be.reverted
      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(initialAccumulatedFee)

      // taking 10% management fee from an invested strategy first time
      await expect(this.strategy.connect(this.owner).setManagementFee(10000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takeManagementFee([])).not.to.be.reverted
      let expectedAccumulatedFee = BigNumber.from(equityValuationAfterInvestment.div(10)).add(initialAccumulatedFee)

      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        expectedAccumulatedFee,
        getErrorRange(BigNumber.from(expectedAccumulatedFee))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(
        initialInvestmentTokenSupply.add(investmentTokenSupplyIncrement)
      )

      // taking 10% management fee from an invested strategy second time
      await expect(this.strategy.connect(this.owner).setManagementFee(10000, [])).not.to.be.reverted
      await expect(this.strategy.connect(this.owner).takeManagementFee([])).not.to.be.reverted
      expectedAccumulatedFee = BigNumber.from(equityValuationAfterInvestment.mul(19).div(100)).add(
        initialAccumulatedFee
      )
      expect(await this.strategy.getCurrentAccumulatedFee()).to.be.approximately(
        expectedAccumulatedFee,
        getErrorRange(BigNumber.from(expectedAccumulatedFee))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(
        initialInvestmentTokenSupply.add(investmentTokenSupplyIncrement)
      )

      // setting up 20% withdrawal fee and withdraw everything
      await expect(this.strategy.connect(this.owner).setWithdrawalFee(20000, [])).not.to.be.reverted
      await expect(
        this.investmentToken.connect(this.user0).approve(this.strategy.address, investmentTokenSupplyIncrement)
      ).not.to.be.reverted
      await expect(
        this.strategy
          .connect(this.user0)
          .withdraw(investmentTokenSupplyIncrement, BigNumber.from(0), this.user0.address, [])
      ).not.to.be.reverted

      let user0ActualLossOfBalance =
        user0UsdcBalanceBeforeInvestment - (await this.depositToken.balanceOf(this.user0.address))
      let user0ExpectedLossOfBalance = equityValuationAfterInvestment.sub(initialEquityValuation).mul(352).div(1000)
      expect(user0ActualLossOfBalance).to.be.approximately(
        user0ExpectedLossOfBalance,
        getErrorRange(BigNumber.from(user0ExpectedLossOfBalance))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.equal(initialInvestmentTokenSupply)
      if (initialEquityValuation == 0) expect(await this.strategy.getEquityValuation(false, false)).to.be.equal(0)

      // claiming all the unclaimed fees (management and withdrawal fee)
      let feeReceiver = await this.strategy.getFeeReceiver([])
      let feeReceiverBalanceBeforeClaiming = await this.depositToken.balanceOf(feeReceiver)
      let feeAmount = await this.strategy.getCurrentAccumulatedFee()

      await expect(this.strategy.connect(this.owner).claimFee([]))
        .to.emit(this.strategy, "FeeClaim")
        .withArgs(feeAmount)
      let feeReceiverBalanceAfterClaiming = await this.depositToken.balanceOf(feeReceiver)

      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(0)
      expect(await this.strategy.getClaimedFee()).to.equal(feeAmount)
      expect(feeReceiverBalanceAfterClaiming - feeReceiverBalanceBeforeClaiming).to.equal(feeAmount)
    })

    it("should succeed when any user calls claim fee", async function () {
      const feeReceiver = await this.strategy.getFeeReceiver([])
      const feeAmount = await this.strategy.getCurrentAccumulatedFee()

      const usdcBalanceBefore = await this.depositToken.balanceOf(feeReceiver)
      await expect(this.strategy.connect(this.user1).claimFee([]))
        .to.emit(this.strategy, "FeeClaim")
        .withArgs(feeAmount)
      const usdcBalanceAfter = await this.depositToken.balanceOf(feeReceiver)

      expect(await this.strategy.getCurrentAccumulatedFee()).to.equal(0)
      expect(await this.strategy.getClaimedFee()).to.equal(feeAmount)
      expect(usdcBalanceAfter - usdcBalanceBefore).to.equal(feeAmount)
    })

    it("should fail when the owner user sets deposit fee greater than or equal to 100%", async function () {
      await expect(this.strategy.connect(this.owner).setDepositFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should fail when the owner user sets withdrawal fee greater than or equal to 100%", async function () {
      await expect(this.strategy.connect(this.owner).setWithdrawalFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should fail when the owner user sets performance fee greater than or equal to 100%", async function () {
      await expect(this.strategy.connect(this.owner).setPerformanceFee(100000, [])).to.be.revertedWithCustomError(
        this.strategy,
        "InvalidFeeError"
      )
    })

    it("should succeed when a single user withdraws and withdrawal fee is 30%", async function () {
      await this.strategy.connect(this.owner).setWithdrawalFee(30000, [])

      await this.depositToken
        .connect(this.user0)
        .approve(this.strategy.address, ethers.utils.parseUnits("10", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user0)
        .deposit(ethers.utils.parseUnits("10", this.depositTokenDecimals), BigNumber.from(0), this.user0.address, [])

      const availableTokenBalance = await this.investmentToken.connect(this.user0).balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, availableTokenBalance)
      await expect(
        this.strategy.connect(this.user0).withdraw(availableTokenBalance, BigNumber.from(0), this.user0.address, [])
      )
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      expect(await this.depositToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("7", this.depositTokenDecimals),
        getErrorRange(ethers.utils.parseUnits("7", this.depositTokenDecimals))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        this.investmentTokenSupply,
        getErrorRange(this.investmentTokenSupply)
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        this.equityValuation,
        getErrorRange(this.equityValuation)
      )
    })

    it("should succeed when multiple users withdraw and withdrawal fee is 30%", async function () {
      // The first user deposits.
      await this.depositToken
        .connect(this.user0)
        .approve(this.strategy.address, ethers.utils.parseUnits("5", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user0)
        .deposit(ethers.utils.parseUnits("5", this.depositTokenDecimals), BigNumber.from(0), this.user0.address, [])

      // The first user withdraws.
      let availableTokenBalance = await this.investmentToken.connect(this.user0).balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, availableTokenBalance.div(5))
      await expect(
        this.strategy
          .connect(this.user0)
          .withdraw(availableTokenBalance.div(5), BigNumber.from(0), this.user0.address, [])
      )
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance.div(5))

      // Set withdrawal fee to 30%.
      await this.strategy.connect(this.owner).setWithdrawalFee(30000, [])

      // The second user deposits.
      await this.depositToken
        .connect(this.user1)
        .approve(this.strategy.address, ethers.utils.parseUnits("5", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user1)
        .deposit(ethers.utils.parseUnits("5", this.depositTokenDecimals), BigNumber.from(0), this.user1.address, [])

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.connect(this.user1).balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, availableTokenBalance.div(5))
      await expect(
        this.strategy
          .connect(this.user1)
          .withdraw(availableTokenBalance.div(5), BigNumber.from(0), this.user1.address, [])
      )
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance.div(5))

      // The third user deposits.
      await this.depositToken
        .connect(this.user2)
        .approve(this.strategy.address, ethers.utils.parseUnits("5", this.depositTokenDecimals))
      await this.strategy
        .connect(this.user2)
        .deposit(ethers.utils.parseUnits("5", this.depositTokenDecimals), BigNumber.from(0), this.user2.address, [])

      // The third user withdraws.
      availableTokenBalance = await this.investmentToken.connect(this.user2).balanceOf(this.user2.address)
      await this.investmentToken.connect(this.user2).approve(this.strategy.address, availableTokenBalance.div(5))
      await expect(
        this.strategy
          .connect(this.user2)
          .withdraw(availableTokenBalance.div(5), BigNumber.from(0), this.user2.address, [])
      )
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user2.address, this.user2.address, availableTokenBalance.div(5))

      const userInvestmentTokenBalance = BigNumber.from(
        Math.floor(ethers.utils.parseUnits("4", this.depositTokenDecimals).toNumber() / this.investmentTokenPrice)
      )
      const strategyInvestmentTokenBalance = BigNumber.from(
        Math.floor(ethers.utils.parseUnits("12", this.depositTokenDecimals).toNumber() / this.investmentTokenPrice)
      )

      expect(await this.depositToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("6", this.depositTokenDecimals),
        getErrorRange(ethers.utils.parseUnits("6", this.depositTokenDecimals))
      )
      expect(await this.depositToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("5.7", this.depositTokenDecimals),
        getErrorRange(ethers.utils.parseUnits("5.7", this.depositTokenDecimals))
      )
      expect(await this.depositToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("5.7", this.depositTokenDecimals),
        getErrorRange(ethers.utils.parseUnits("5.7", this.depositTokenDecimals))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        userInvestmentTokenBalance,
        getErrorRange(userInvestmentTokenBalance)
      )
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        userInvestmentTokenBalance,
        getErrorRange(userInvestmentTokenBalance)
      )
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        userInvestmentTokenBalance,
        getErrorRange(userInvestmentTokenBalance)
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        strategyInvestmentTokenBalance.add(this.investmentTokenSupply),
        getErrorRange(strategyInvestmentTokenBalance.add(this.investmentTokenSupply))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("12", this.depositTokenDecimals).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("12", this.depositTokenDecimals).add(this.equityValuation))
      )
    })
  })
}
