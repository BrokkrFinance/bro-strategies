import { expect } from "chai"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import investableAbi from "../helper/abi/investable.json"
import { getErrorRange } from "../helper/utils"
import { testWithdraw } from "../shared/Withdraw.test"

export function testPortfolioWithdraw() {
  describe("Withdraw", async function () {
    testWithdraw()

    it("should succeed when a single user withdraws and another user withdrew from investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      let availableTokenBalance = await investableInvestmentToken.balanceOf(this.user1.address)
      await investableInvestmentToken.connect(this.user1).approve(investable.address, availableTokenBalance)
      await expect(investable.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, [])).not.to.be
        .reverted

      availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

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
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        investableInvestmentTokenSupply,
        getErrorRange(investableInvestmentTokenSupply)
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        this.equityValuation,
        getErrorRange(this.equityValuation)
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        investableEquityValuation,
        getErrorRange(investableEquityValuation)
      )
    })

    it("should succeed when a single user withdraws and another user withdrew from investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

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
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        investableInvestmentTokenSupply,
        getErrorRange(investableInvestmentTokenSupply)
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        this.equityValuation,
        getErrorRange(this.equityValuation)
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        investableEquityValuation,
        getErrorRange(investableEquityValuation)
      )
    })

    it("should succeed when multiple user withdraws and another user withdrew from investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      // The third user deposits.
      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The third user withdraws.
      let availableTokenBalance = await investableInvestmentToken.balanceOf(this.user2.address)
      await investableInvestmentToken.connect(this.user2).approve(investable.address, availableTokenBalance)
      await expect(investable.connect(this.user2).withdraw(availableTokenBalance, this.user2.address, [])).not.to.be
        .reverted

      // The first user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

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
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        investableInvestmentTokenSupply,
        getErrorRange(investableInvestmentTokenSupply)
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        this.equityValuation,
        getErrorRange(this.equityValuation)
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        investableEquityValuation,
        getErrorRange(investableEquityValuation)
      )
    })

    it("should succeed when multiple user withdraws and another user withdrew from investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      // The first user deposits.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      // The second user deposits.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

      // The third user deposits.
      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user withdraws.
      let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investmentToken.connect(this.user1).approve(this.portfolio.address, availableTokenBalance)
      await expect(this.portfolio.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
        .to.emit(this.portfolio, "Withdrawal")
        .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

      availableTokenBalance = await investableInvestmentToken.balanceOf(this.user2.address)
      await investableInvestmentToken.connect(this.user2).approve(investable.address, availableTokenBalance)
      await expect(investable.connect(this.user2).withdraw(availableTokenBalance, this.user2.address, [])).not.to.be
        .reverted

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
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        investableInvestmentTokenSupply,
        getErrorRange(investableInvestmentTokenSupply)
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        this.equityValuation,
        getErrorRange(this.equityValuation)
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        investableEquityValuation,
        getErrorRange(investableEquityValuation)
      )
    })
  })
}
