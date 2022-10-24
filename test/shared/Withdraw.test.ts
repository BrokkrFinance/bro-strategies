import { BigNumber } from "ethers"
import { ethers } from "hardhat"

export function testWithdraw() {
  it("should succeed when a single user withdraws InvestmentToken that he/she has - fully withdraw", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - partially withdraw", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("10000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - partially withdraw and let someone else receive USDC", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("5000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user withdraws InvestmentToken that he/she has - let someone else receive InvestmentToken and fully withdraw", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("10000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should fail when a single user withdraws zero amount", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: BigNumber.from(0),
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountWithdrawn")
  })

  it("should fail when a single user withdraws that he/she doesn't have", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance.add(1),
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .reverted()
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - delayed fully withdraw", async function () {
    // The first user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - delayed partially withdraw", async function () {
    // The first user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should succeed when multiple users withdraw InvestmentTokens that they have - immediate full withdrawal", async function () {
    // The first user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should fail when multiple users withdraw zero amount", async function () {
    // The first user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The first user withdraws.
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: BigNumber.from(0),
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountWithdrawn")

    // The second user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The second user withdraws.
    const availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance,
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .success()
  })

  it("should fail when multiple users withdraw that they don't have", async function () {
    // The first user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The first user withdraws.
    let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user0, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user1, {
        amount: availableTokenBalance.add(1),
        depositTokenReceiver: this.user1.address,
        params: [],
      })
      .reverted()

    // The third user deposits.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .success()

    // The third user withdraws.
    availableTokenBalance = await this.investmentToken.balanceOf(this.user2.address)
    await this.withdrawHelper
      .withdraw(this.investable, this.user2, {
        amount: availableTokenBalance.div(2),
        depositTokenReceiver: this.user2.address,
        params: [],
      })
      .success()
  })
}
