import { expect } from "chai"
import { ethers } from "hardhat"
import erc20Abi from "../shared/abi/erc20.json"
import investableAbi from "../shared/abi/investable.json"
import { getErrorRange } from "../shared/utils"

export function testDeposit() {
  describe("Deposit", async function () {
    it("should succeed when a single user deposits USDC that he/she has - integer amount", async function () {
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
    })

    it("should succeed when a single user deposits USDC that he/she has - fractional amount", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3701.810393", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3701.810393", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3701.810393", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("6298.189607", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("32701.810393", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6).add(this.equityValuation))
      )
    })

    it("should fail when a single user deposits zero amount", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, 0)
      await expect(this.portfolio.connect(this.user0).deposit(0, this.user0.address, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "ZeroAmountDeposited"
      )

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)
    })

    it("should fail when a single user deposits USDC that he/she doesn't have", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10001", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10001", 6), this.user0.address, [])
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)
    })

    it("should fail when a single user deposits exceeding limit per address", async function () {
      await this.portfolio.connect(this.owner).setInvestmentLimitPerAddress(ethers.utils.parseUnits("49", 6))

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("50", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestmentLimitPerAddressExceeded")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)
    })

    it("should fail when a single user deposits exceeding total limit", async function () {
      await this.portfolio.connect(this.owner).setTotalInvestmentLimit(ethers.utils.parseUnits("49", 6))

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("50", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "TotalInvestmentLimitExceeded")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)
    })

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

    it("should succeed when multiple users deposit USDC that they have - integer amount", async function () {
      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.equityValuation))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(this.equityValuation))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user2).deposit(ethers.utils.parseUnits("30", 6), this.user2.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("90", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("90", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("90", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("90", 6).add(this.equityValuation))
      )
    })

    it("should succeed when multiple users deposit USDC that they have - fractional amount", async function () {
      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3701.810393", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3701.810393", 6), this.user0.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3701.810393", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("6298.189607", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6).add(this.equityValuation))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3701.810393", 6))
      await expect(
        this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3701.810393", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("3701.810393", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("6298.189607", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("7403.620786", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("7403.620786", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("7403.620786", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("7403.620786", 6).add(this.equityValuation))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("3701.810393", 6))
      await expect(
        this.portfolio.connect(this.user2).deposit(ethers.utils.parseUnits("3701.810393", 6), this.user2.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("3701.810393", 6))

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("6298.189607", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("3701.810393", 6),
        getErrorRange(ethers.utils.parseUnits("3701.810393", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("11105.431179", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("11105.431179", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("11105.431179", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("11105.431179", 6).add(this.equityValuation))
      )
    })

    it("should fail when multiple users deposit zero amount", async function () {
      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, 0)
      await expect(this.portfolio.connect(this.user0).deposit(0, this.user0.address, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "ZeroAmountDeposited"
      )

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])
      )
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("3000", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
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

      // The third user.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, 0)
      await expect(this.portfolio.connect(this.user2).deposit(0, this.user2.address, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "ZeroAmountDeposited"
      )

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
      )
    })

    it("should fail when multiple users deposit USDC that they don't have", async function () {
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
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("10001", 6))
      await expect(
        this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("10001", 6), this.user1.address, [])
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance")

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
      )
    })

    it("should fail when multiple users deposit exceeding limit per address", async function () {
      await this.portfolio.connect(this.owner).setInvestmentLimitPerAddress(ethers.utils.parseUnits("49", 6))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("50", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestmentLimitPerAddressExceeded")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
      expect(await this.portfolio.getEquityValuation(true, false)).to.equal(this.equityValuation)

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.equityValuation))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("50", 6))
      await expect(
        this.portfolio.connect(this.user2).deposit(ethers.utils.parseUnits("50", 6), this.user2.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestmentLimitPerAddressExceeded")

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.equityValuation),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.equityValuation))
      )
    })

    it("should fail when multiple users deposit exceeding total limit", async function () {
      await this.portfolio
        .connect(this.owner)
        .setTotalInvestmentLimit(ethers.utils.parseUnits("89", 6).add(this.equityValuation))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("30", 6).add(this.investmentTokenSupply))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(this.portfolio.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.portfolio, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("9970", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.portfolio.address, ethers.utils.parseUnits("30", 6))
      await expect(
        this.portfolio.connect(this.user2).deposit(ethers.utils.parseUnits("30", 6), this.user2.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "TotalInvestmentLimitExceeded")

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("60", 6)).add(this.investmentTokenSupply)
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply),
        getErrorRange(ethers.utils.parseUnits("60", 6).add(this.investmentTokenSupply))
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
