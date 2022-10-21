import { expect } from "chai"
import { ethers } from "hardhat"
import { getErrorRange } from "../helper/utils"

export function testWithdraw() {
  it("should succeed when a single user withdraws InvestmentToken that he/she has - fully withdraw", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.investmentToken.connect(this.user0).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("10000", 6),
      getErrorRange(ethers.utils.parseUnits("10000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
    expect(await this.investable.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      this.equityValuation,
      getErrorRange(this.equityValuation)
    )
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - partially withdraw", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("10000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

    await this.investmentToken.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await expect(
      this.investable.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("3000", 6))

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6),
      getErrorRange(ethers.utils.parseUnits("3000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("7000", 6),
      getErrorRange(ethers.utils.parseUnits("7000", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("7000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("7000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("7000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("7000", 6).add(this.equityValuation))
    )
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - partially withdraw and let someone else receive USDC", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("5000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("5000", 6), this.user0.address, [])

    const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)
    await this.investmentToken.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))

    await expect(
      this.investable.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user1.address, [])
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user1.address, ethers.utils.parseUnits("3000", 6))

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("5000", 6),
      getErrorRange(ethers.utils.parseUnits("5000", 6))
    )
    expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(usdcBalanceBefore),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(usdcBalanceBefore))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("2000", 6),
      getErrorRange(ethers.utils.parseUnits("2000", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("2000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("2000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("2000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("2000", 6).add(this.equityValuation))
    )
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - let someone else receive InvestmentToken and fully withdraw", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("10000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user1.address, [])

    const usdcBalanceBefore = await this.usdc.balanceOf(this.user1.address)

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.investmentToken.connect(this.user1).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

    expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
    expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("10000", 6).add(usdcBalanceBefore),
      getErrorRange(ethers.utils.parseUnits("10000", 6).add(usdcBalanceBefore))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
    expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
    expect(await this.investable.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      this.equityValuation,
      getErrorRange(this.equityValuation)
    )
  })

  it("should fail when a single user withdraws zero amount", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    await this.investmentToken.connect(this.user0).approve(this.investable.address, 0)
    await expect(this.investable.connect(this.user0).withdraw(0, this.user0.address, [])).to.be.revertedWithCustomError(
      this.investable,
      "ZeroAmountWithdrawn"
    )

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("7000", 6),
      getErrorRange(ethers.utils.parseUnits("7000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6),
      getErrorRange(ethers.utils.parseUnits("3000", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
    )
  })

  it("should fail when a single user withdraws that he/she doesn't have", async function () {
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    const investmentTokenAmount = await this.investmentToken.balanceOf(this.user0.address)
    await this.investmentToken.connect(this.user0).approve(this.investable.address, investmentTokenAmount.add(1))
    await expect(this.investable.connect(this.user0).withdraw(investmentTokenAmount.add(1), this.user0.address, [])).to
      .be.reverted

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("7000", 6),
      getErrorRange(ethers.utils.parseUnits("7000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6),
      getErrorRange(ethers.utils.parseUnits("3000", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
    )
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - full delayed withdraw", async function () {
    // The first user deposits.
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    // The second user deposits.
    await this.usdc.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.investmentToken.connect(this.user0).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.investmentToken.connect(this.user1).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

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
    expect(await this.investable.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      this.equityValuation,
      getErrorRange(this.equityValuation)
    )
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - partial delayed withdraw", async function () {
    // The first user deposits.
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    // The second user deposits.
    await this.usdc.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

    // The first user withdraws.
    await this.investmentToken.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("1500", 6))
    await expect(
      this.investable.connect(this.user0).withdraw(ethers.utils.parseUnits("1500", 6), this.user0.address, [])
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("1500", 6))

    // The second user withdraws.
    const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    const investmentTokenBalanceHalf = Math.floor(investmentTokenBalance / 2)
    await this.investmentToken.connect(this.user1).approve(this.investable.address, investmentTokenBalanceHalf)
    await expect(this.investable.connect(this.user1).withdraw(investmentTokenBalanceHalf, this.user1.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user1.address, this.user1.address, investmentTokenBalanceHalf)

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("8500", 6),
      getErrorRange(ethers.utils.parseUnits("8500", 6))
    )
    expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("8500", 6),
      getErrorRange(ethers.utils.parseUnits("8500", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("1500", 6),
      getErrorRange(ethers.utils.parseUnits("1500", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("1500", 6),
      getErrorRange(ethers.utils.parseUnits("1500", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
    )
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - full immediate withdrawal", async function () {
    // The first user deposits.
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.investmentToken.connect(this.user0).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user0).withdraw(availableTokenBalance, this.user0.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, availableTokenBalance)

    // The second user deposits.
    await this.usdc.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.investmentToken.connect(this.user1).approve(this.investable.address, availableTokenBalance)
    await expect(this.investable.connect(this.user1).withdraw(availableTokenBalance, this.user1.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user1.address, this.user1.address, availableTokenBalance)

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
    expect(await this.investable.getInvestmentTokenSupply()).to.equal(this.investmentTokenSupply)
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      this.equityValuation,
      getErrorRange(this.equityValuation)
    )
  })

  it("should fail when multiple users withdraw zero amount", async function () {
    // The first user deposits.
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    // The first user withdraws.
    await this.investmentToken.connect(this.user0).approve(this.investable.address, 0)
    await expect(this.investable.connect(this.user0).withdraw(0, this.user0.address, [])).to.be.revertedWithCustomError(
      this.investable,
      "ZeroAmountWithdrawn"
    )

    // The second user deposits.
    await this.usdc.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

    // The second user withdraws.
    const investmentTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.investmentToken.connect(this.user1).approve(this.investable.address, investmentTokenBalance)
    await expect(this.investable.connect(this.user1).withdraw(investmentTokenBalance, this.user1.address, []))
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user1.address, this.user1.address, investmentTokenBalance)

    expect(await this.usdc.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("7000", 6),
      getErrorRange(ethers.utils.parseUnits("7000", 6))
    )
    expect(await this.usdc.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("10000", 6),
      getErrorRange(ethers.utils.parseUnits("10000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6),
      getErrorRange(ethers.utils.parseUnits("3000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("3000", 6).add(this.equityValuation))
    )
  })

  it("should fail when multiple users withdraw that they don't have", async function () {
    // The first user deposits.
    await this.usdc.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

    // The second user deposits.
    await this.usdc.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user1).deposit(ethers.utils.parseUnits("3000", 6), this.user1.address, [])

    // The first user withdraws.
    await this.investmentToken.connect(this.user0).approve(this.investable.address, ethers.utils.parseUnits("1500", 6))
    await expect(
      this.investable.connect(this.user0).withdraw(ethers.utils.parseUnits("1500", 6), this.user0.address, [])
    )
      .to.emit(this.investable, "Withdrawal")
      .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("1500", 6))

    // The second user withdraws.
    await this.investmentToken.connect(this.user1).approve(this.investable.address, ethers.utils.parseUnits("5000", 6))
    await expect(
      this.investable.connect(this.user1).withdraw(ethers.utils.parseUnits("5000", 6), this.user1.address, [])
    ).to.be.reverted

    // The third user deposits.
    await this.usdc.connect(this.user2).approve(this.investable.address, ethers.utils.parseUnits("3000", 6))
    await this.investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, [])

    // The third user withdraws.
    await this.investmentToken.connect(this.user2).approve(this.investable.address, ethers.utils.parseUnits("1500", 6))
    await expect(
      this.investable.connect(this.user2).withdraw(ethers.utils.parseUnits("1500", 6), this.user2.address, [])
    )
      .to.emit(this.investable, "Withdrawal")
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
    expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
      ethers.utils.parseUnits("1500", 6),
      getErrorRange(ethers.utils.parseUnits("1500", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user1.address)).to.be.approximately(
      ethers.utils.parseUnits("3000", 6),
      getErrorRange(ethers.utils.parseUnits("3000", 6))
    )
    expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
      ethers.utils.parseUnits("1500", 6),
      getErrorRange(ethers.utils.parseUnits("1500", 6))
    )
    expect(await this.investable.getInvestmentTokenSupply()).to.be.approximately(
      ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply),
      getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.investmentTokenSupply))
    )
    expect(await this.investable.getEquityValuation(true, false)).to.be.approximately(
      ethers.utils.parseUnits("6000", 6).add(this.equityValuation),
      getErrorRange(ethers.utils.parseUnits("6000", 6).add(this.equityValuation))
    )
  })
}
