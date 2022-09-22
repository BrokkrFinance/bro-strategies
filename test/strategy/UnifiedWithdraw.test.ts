import { expect } from "chai"
import { ethers } from "hardhat"
import { airdropToken, getErrorRange } from "../shared/utils"

export function testWithdraw() {
  describe("Withdraw", async function () {
    it("should succeed when a single user withdraws InvestmentToken that he/she has - full withdrawal", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      const availableTokenBalance = await this.investmentToken.connect(this.user0).balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)
    })

    it("should succeed when a single user withdraws InvestmentToken that he/she has - partial withdrawal", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("200", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("30", 6), this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("130", 6),
        getErrorRange(ethers.utils.parseUnits("130", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })

    it("should succeed when a single user withdraws InvestmentToken that he/she has - partial withdraw on behalf", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("200", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await expect(this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(usdcBalanceBefore),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(usdcBalanceBefore))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })

    it("should succeed when a single user withdraws InvestmentToken that he/she has - full withdrawal after deposit on behalf", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("200", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user1.address, [])

      const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)

      const availableTokenBalance = await this.investmentToken.connect(this.user1).balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6).add(usdcBalanceBefore),
        getErrorRange(ethers.utils.parseUnits("100", 6).add(usdcBalanceBefore))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)
    })

    it("should fail when a single user withdraws zero amount", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, 0)
      await expect(this.strategy.connect(this.user0).withdraw(0, this.user0.address, [])).to.be.revertedWithCustomError(
        this.strategy,
        "ZeroAmountWithdrawn"
      )

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
    })

    it("should fail when a single user withdraws that he/she doesn't have", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await expect(this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("50", 6), this.user0.address, []))
        .to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
    })

    it("should succeed when multiple users withdraw InvestmentTokens that they have - full delayed withdraw", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, [])

      // The first user withdraws.
      let availableTokenBalance = await this.investmentToken.connect(this.user0).balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)
    })

    it("should succeed when multiple users withdraw InvestmentTokens that they have - partial delayed withdraw", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, [])

      // The first user partially withdraws.
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("15", 6))
      await expect(this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("15", 6), this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("15", 6))

      // The second user partially withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      const investmentTokenBalanceHalf = Math.floor(investmentTokenBalance / 2)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, investmentTokenBalanceHalf)
      await expect(this.strategy.connect(this.user1).withdraw(investmentTokenBalanceHalf, this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalanceHalf)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("85", 6),
        getErrorRange(ethers.utils.parseUnits("85", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("85", 6),
        getErrorRange(ethers.utils.parseUnits("85", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("15", 6),
        getErrorRange(ethers.utils.parseUnits("15", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("15", 6),
        getErrorRange(ethers.utils.parseUnits("15", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
    })

    it("should succeed when multiple users withdraw InvestmentTokens that they have - full immediate withdrawal", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      // The first user fully withdraws.
      let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, [])

      // The second user fully withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, availableTokenBalance)
      await expect(this.strategy.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)
    })

    it("should fail when multiple users withdraw zero amount", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, 0)
      await expect(this.strategy.connect(this.user0).withdraw(0, this.user0.address, [])).to.be.revertedWithCustomError(
        this.strategy,
        "ZeroAmountWithdrawn"
      )

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, [])

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, investmentTokenBalance)
      await expect(this.strategy.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
    })

    it("should fail when multiple users withdraw that they don't have", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user2, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, [])

      // The first user withdraws half.
      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("15", 6))
      await expect(this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("15", 6), this.user0.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("15", 6))

      // The second user withdraws too much.
      await this.investmentToken.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await expect(this.strategy.connect(this.user1).withdraw(ethers.utils.parseUnits("50", 6), this.user1.address, []))
        .to.be.reverted

      // The third user deposits.
      await this.usdc.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("30", 6), this.user2.address, [])

      // The third user withdraws half.
      await this.investmentToken.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("15", 6))
      await expect(this.strategy.connect(this.user2).withdraw(ethers.utils.parseUnits("15", 6), this.user2.address, []))
        .to.emit(this.strategy, "Withdrawal")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("15", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("85", 6),
        getErrorRange(ethers.utils.parseUnits("85", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.usdc.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("85", 6),
        getErrorRange(ethers.utils.parseUnits("85", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("15", 6),
        getErrorRange(ethers.utils.parseUnits("15", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("15", 6),
        getErrorRange(ethers.utils.parseUnits("15", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6),
        getErrorRange(ethers.utils.parseUnits("60", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6),
        getErrorRange(ethers.utils.parseUnits("60", 6))
      )
    })
  })
}
