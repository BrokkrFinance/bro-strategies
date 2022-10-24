import { BigNumber } from "ethers"
import { ethers } from "hardhat"

export function testDeposit() {
  it("should succeed when a single user deposits USDC that he/she has - integer amount", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should succeed when a single user deposits USDC that he/she has - fractional amount", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3701.810393", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()
  })

  it("should fail when a single user deposits zero amount", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")
  })

  it("should fail when a single user deposits USDC that he/she doesn't have", async function () {
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("10001", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWith("ERC20: transfer amount exceeds balance")
  })

  it("should fail when a single user deposits exceeding limit per address", async function () {
    await this.investable.connect(this.owner).setInvestmentLimitPerAddress(ethers.utils.parseUnits("49", 6))

    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("50", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")
  })

  it("should fail when a single user deposits exceeding total limit", async function () {
    await this.investable
      .connect(this.owner)
      .setTotalInvestmentLimit(ethers.utils.parseUnits("49", 6).add(this.equityValuation))

    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("50", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("TotalInvestmentLimitExceeded")
  })

  it("should succeed when multiple users deposit USDC that they have - integer amount", async function () {
    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .success()
  })

  it("should succeed when multiple users deposit USDC that they have - fractional amount", async function () {
    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3701.810393", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3701.810393", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("3701.810393", 6),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .success()
  })

  it("should fail when multiple users deposit zero amount", async function () {
    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: BigNumber.from(0),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: BigNumber.from(0),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("ZeroAmountDeposited")
  })

  it("should fail when multiple users deposit USDC that they don't have", async function () {
    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("3000", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("10001", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .revertedWith("ERC20: transfer amount exceeds balance")
  })

  it("should fail when multiple users deposit exceeding limit per address", async function () {
    await this.investable.connect(this.owner).setInvestmentLimitPerAddress(ethers.utils.parseUnits("49", 6))

    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("50", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("50", 6),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("InvestmentLimitPerAddressExceeded")
  })

  it("should fail when multiple users deposit exceeding total limit", async function () {
    await this.investable
      .connect(this.owner)
      .setTotalInvestmentLimit(ethers.utils.parseUnits("89", 6).add(this.equityValuation))

    // The first user.
    await this.depositHelper
      .deposit(this.investable, this.user0, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user0.address,
        params: [],
      })
      .success()

    // The second user.
    await this.depositHelper
      .deposit(this.investable, this.user1, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user1.address,
        params: [],
      })
      .success()

    // The third user.
    await this.depositHelper
      .deposit(this.investable, this.user2, {
        amount: ethers.utils.parseUnits("30", 6),
        investmentTokenReceiver: this.user2.address,
        params: [],
      })
      .revertedWithCustomError("TotalInvestmentLimitExceeded")
  })
}
