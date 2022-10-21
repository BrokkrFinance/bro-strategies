import { expect } from "chai"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import investableAbi from "../helper/abi/investable.json"
import { getErrorRange } from "../helper/utils"
import { testDeposit } from "../shared/Deposit.test"

export function testPortfolioDeposit() {
  describe("Deposit - Portfolio", async function () {
    testDeposit()

    it("should succeed when a single user deposits USDC that he/she has and another user deposited into investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableAllocationPercentage = await investables[0].allocationPercentage
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      const investableDepositAmount = ethers.utils.parseUnits("3000", 6).mul(investableAllocationPercentage).div(100000)

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableInvestmentTokenSupply).add(investableDepositAmount),
        getErrorRange(
          ethers.utils.parseUnits("3000", 6).add(investableInvestmentTokenSupply).add(investableDepositAmount)
        )
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableEquityValuation).add(investableDepositAmount),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(investableEquityValuation).add(investableDepositAmount))
      )
    })

    it("should succeed when a single user deposits USDC that he/she has and another user deposits into investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableAllocationPercentage = await investables[0].allocationPercentage
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      await this.usdc.connect(this.user1).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, []))
        .not.to.be.reverted

      const investableDepositAmount = ethers.utils.parseUnits("3000", 6).mul(investableAllocationPercentage).div(100000)

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableInvestmentTokenSupply).add(investableDepositAmount),
        getErrorRange(
          ethers.utils.parseUnits("3000", 6).add(investableInvestmentTokenSupply).add(investableDepositAmount)
        )
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableEquityValuation).add(investableDepositAmount),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(investableEquityValuation).add(investableDepositAmount))
      )
    })

    it("should succeed when multiple users deposit USDC that they have and another user deposited into investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableAllocationPercentage = await investables[0].allocationPercentage
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      let investableDepositAmount = ethers.utils.parseUnits("3000", 6).mul(investableAllocationPercentage).div(100000)

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply),
        getErrorRange(
          ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply)
        )
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("3000", 6))

      investableDepositAmount = ethers.utils.parseUnits("6000", 6).mul(investableAllocationPercentage).div(100000)

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply),
        getErrorRange(
          ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply)
        )
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("6000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.equityValuation))
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation))
      )
    })

    it("should succeed when multiple users deposit USDC that they have and another user deposits into investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())
      const investableAllocationPercentage = await investables[0].allocationPercentage
      const investableInvestmentTokenSupply = await investable.getInvestmentTokenSupply()
      const investableEquityValuation = await investable.getEquityValuation(true, false)

      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("3000", 6))

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      const investableDepositAmount = ethers.utils.parseUnits("6000", 6).mul(investableAllocationPercentage).div(100000)

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply))
      )
      expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply),
        getErrorRange(
          ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableInvestmentTokenSupply)
        )
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("6000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.equityValuation))
      )
      expect(await investable.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(investableDepositAmount).add(investableEquityValuation))
      )
    })
  })
}
