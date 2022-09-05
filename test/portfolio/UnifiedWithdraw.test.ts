import { expect } from "chai"
import { ethers } from "hardhat"
import erc20Abi from "../shared/abi/erc20.json"
import investableAbi from "../shared/abi/investable.json"
import { getErrorRange } from "../shared/utils"

export function testWithdraw() {
  describe("Withdraw", async function () {
    it("should success when a single user withdraws InvestmentToken that he/she has - 0", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when a single user withdraws InvestmentToken that he/she has - 1", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("7000", 6),
        getErrorRange(ethers.utils.parseUnits("7000", 6))
      )
    })

    it("should success when a single user withdraws InvestmentToken that he/she has - 2", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

      const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user1.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("5000", 6),
        getErrorRange(ethers.utils.parseUnits("5000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(usdcBalanceBefore),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(usdcBalanceBefore))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("2000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("2000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("2000", 6),
        getErrorRange(ethers.utils.parseUnits("2000", 6))
      )
    })

    it("should success when a single user withdraws InvestmentToken that he/she has - 3", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user1.address, [])

      const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)

      await this.investmentToken
        .connect(this.user1)
        .approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await expect(
        this.portfolio.connect(this.user1).withdraw(ethers.utils.parseUnits("10000", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("10000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6).add(usdcBalanceBefore),
        getErrorRange(ethers.utils.parseUnits("10000", 6).add(usdcBalanceBefore))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
    })

    it("should fail when a single user withdraws zero amount", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, 0)
      await expect(
        this.portfolio.connect(this.user0).withdraw(0, this.user0.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "ZeroAmountWithdrawn")

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("7000", 6),
        getErrorRange(ethers.utils.parseUnits("7000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
    })

    it("should fail when a single user withdraws that he/she doesn't have", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3001", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3001", 6), this.user0.address, [])
      ).to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("7000", 6),
        getErrorRange(ethers.utils.parseUnits("7000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
    })

    it("should success when a single user withdraws and another user withdrew from investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      await investableInvestmentToken
        .connect(this.user1)
        .approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).withdraw(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await investableInvestmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await investable.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
      expect(await investable.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when a single user withdraws and another user withdrew from investable directly after that", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      const investableInvestmentTokenAmount = await investableInvestmentToken.balanceOf(this.user1.address)
      await investableInvestmentToken.connect(this.user1).approve(investable.address, investableInvestmentTokenAmount)
      await expect(investable.connect(this.user1).withdraw(investableInvestmentTokenAmount, this.user1.address, [])).not
        .to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await investableInvestmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await investable.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
      expect(await investable.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when multiple users withdraw InvestmentTokens that they have - 0", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when multiple users withdraw InvestmentTokens that they have - 1", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1500", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("1500", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("1500", 6))

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      const investmentTokenBalanceHalf = Math.floor(investmentTokenBalance / 2)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalanceHalf)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalanceHalf, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalanceHalf)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("8500", 6),
        getErrorRange(ethers.utils.parseUnits("8500", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("8500", 6),
        getErrorRange(ethers.utils.parseUnits("8500", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("1500", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("1500", 6),
        getErrorRange(ethers.utils.parseUnits("1500", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
    })

    it("should success when multiple users withdraw InvestmentTokens that they have - 2", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
    })

    it("should fail when multiple users withdraw zero amount", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, 0)
      await expect(
        this.portfolio.connect(this.user0).withdraw(0, this.user0.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "ZeroAmountWithdrawn")

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("7000", 6),
        getErrorRange(ethers.utils.parseUnits("7000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("3000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
    })

    it("should fail when multiple users withdraw that they don't have", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("1500", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("1500", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("1500", 6))

      // The second user withdraws.
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("5000", 6))
      await expect(
        this.portfolio.connect(this.user1).withdraw(ethers.utils.parseUnits("5000", 6), this.user1.address, [])
      ).to.be.reverted

      // The third user deposits.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, [])

      // The third user withdraws.
      await this.investmentToken.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("1500", 6))
      await expect(
        this.portfolio.connect(this.user2).withdraw(ethers.utils.parseUnits("1500", 6), this.user2.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("1500", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("8500", 6),
        getErrorRange(ethers.utils.parseUnits("8500", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("8500", 6),
        getErrorRange(ethers.utils.parseUnits("8500", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("1500", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("1500", 6),
        getErrorRange(ethers.utils.parseUnits("1500", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("6000", 6),
        getErrorRange(ethers.utils.parseUnits("6000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("6000", 6),
        getErrorRange(ethers.utils.parseUnits("6000", 6))
      )
    })

    it("should success when multiple user withdraws and another user withdrew from investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      await investableInvestmentToken
        .connect(this.user2)
        .approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).withdraw(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await investable.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
      expect(await investable.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when multiple user withdraws and another user withdrew from investable directly after that", async function () {
      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user withdraws.
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      // The second user withdraws.
      const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, investmentTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

      const investableInvestmentTokenAmount = await investableInvestmentToken.balanceOf(this.user2.address)
      await investableInvestmentToken.connect(this.user2).approve(investable.address, investableInvestmentTokenAmount)
      await expect(investable.connect(this.user2).withdraw(investableInvestmentTokenAmount, this.user2.address, [])).not
        .to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.usdc.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(0)
      expect(await investable.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(0)
      expect(await investable.getEquityValuation(true, false)).to.equal(0)
    })
  })
}
