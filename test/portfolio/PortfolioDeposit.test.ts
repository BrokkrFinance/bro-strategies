import { ethers } from "hardhat"
import investableAbi from "../helper/abi/investable.json"
import { testDeposit } from "../shared/Deposit.test"

export function testPortfolioDeposit() {
  describe("Deposit - Portfolio", async function () {
    testDeposit()

    it("should succeed when a single user deposits USDC that he/she has and another user deposited into investable directly before that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

      // The second user deposits directly.
      await this.depositHelper
        .deposit(investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The first user deposits.
      await this.depositHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
    })

    it("should succeed when a single user deposits USDC that he/she has and another user deposits into investable directly after that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

      // The first user deposits.
      await this.depositHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits directly.
      await this.depositHelper
        .deposit(investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()
    })

    it("should succeed when multiple users deposit USDC that they have and another user deposited into investable directly before that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

      // The third user deposits directly.
      await this.depositHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

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
    })

    it("should succeed when multiple users deposit USDC that they have and another user deposits into investable directly after that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

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

      // The third user deposits directly.
      await this.depositHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()
    })
  })
}
