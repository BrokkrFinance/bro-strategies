import { BigNumber } from "ethers"
import { ethers } from "hardhat"

export function testDeposit() {
  it("should succeed when a single user deposits USDC that he/she has - integer amount", async function () {
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user deposits USDC that he/she has - fractional amount", async function () {
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3.78", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user deposits USDC, and expect a reasonable investment value", async function () {
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: ethers.utils.parseUnits("1.5", this.depositTokenDecimals),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should fail when a single user deposits zero amount", async function () {
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: BigNumber.from(0),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")
  })

  it("should fail when a single user deposits and expects too high investment value", async function () {
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("10", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: ethers.utils.parseUnits("101", this.depositTokenDecimals),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("TooSmallDepositTokenAmountOut")
  })

  it("should fail when a single user deposits exceeding limit per address", async function () {
    await this.investable
      .connect(this.owner)
      .setInvestmentLimitPerAddress(ethers.utils.parseUnits("4", this.depositTokenDecimals))

    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")
  })

  it("should fail when a single user deposits exceeding total limit", async function () {
    await this.investable
      .connect(this.owner)
      .setTotalInvestmentLimit(ethers.utils.parseUnits("4", this.depositTokenDecimals).add(this.equityValuation))

    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("TotalInvestmentLimitExceeded")
  })

  it("should succeed when multiple users deposit USDC that they have - integer amount", async function () {
    // The first user.
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.investHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.investHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .success()
  })

  it("should succeed when multiple users deposit USDC that they have - fractional amount", async function () {
    // The first user.
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3.78", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.investHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3.78", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.investHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("3.78", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .success()
  })

  it("should fail when multiple users deposit zero amount", async function () {
    // The first user.
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: BigNumber.from(0),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")

    // The second user.
    await this.investHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.investHelper
      .deposit(this.investable, this.user2, {
        amount: BigNumber.from(0),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")
  })

  it("should fail when multiple users deposit exceeding limit per address", async function () {
    await this.investable
      .connect(this.owner)
      .setInvestmentLimitPerAddress(ethers.utils.parseUnits("4", this.depositTokenDecimals))

    // The first user.
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")

    // The second user.
    await this.investHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.investHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("5", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")
  })

  it("should fail when multiple users deposit exceeding total limit", async function () {
    await this.investable
      .connect(this.owner)
      .setTotalInvestmentLimit(ethers.utils.parseUnits("8", this.depositTokenDecimals).add(this.equityValuation))

    // The first user.
    await this.investHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.investHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.investHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("3", this.depositTokenDecimals),
        minimumDepositTokenAmountOut: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("TotalInvestmentLimitExceeded")
  })
}
