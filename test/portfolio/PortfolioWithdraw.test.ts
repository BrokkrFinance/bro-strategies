import { expect } from "chai"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import investableAbi from "../helper/abi/investable.json"
import { getErrorRange } from "../helper/utils"
import { testWithdraw } from "../shared/Withdraw.test"

export function testPortfolioWithdraw() {
  describe("Withdraw", async function () {
    // testWithdraw()

    it("should succeed when a single user withdraws and another user withdrew from investable directly before that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The second user deposits directly.
      await this.investHelper
        .deposit(investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The first user deposits.
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user withdraws directly.
      let availableTokenBalance = await investableInvestmentToken.balanceOf(this.user1.address)
      await this.investHelper
        .withdraw(investable, this.user1, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()
    })

    it("should succeed when a single user withdraws and another user withdrew from investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The first user deposits.
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits directly.
      await this.investHelper
        .deposit(investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user withdraws directly.
      availableTokenBalance = await investableInvestmentToken.balanceOf(this.user1.address)
      await this.investHelper
        .withdraw(investable, this.user1, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user1.address,
          params: [],
        })
        .success()
    })

    it("should succeed when multiple user withdraws and another user withdrew from investable directly before that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The third user deposits directly.
      await this.investHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // The first user deposits.
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits.
      await this.investHelper
        .deposit(this.investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The third user withdraws directly.
      let availableTokenBalance = await investableInvestmentToken.balanceOf(this.user2.address)
      await this.investHelper
        .withdraw(investable, this.user2, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investHelper
        .withdraw(this.investable, this.user1, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user1.address,
          params: [],
        })
        .success()
    })

    it("should succeed when multiple user withdraws and another user withdrew from investable directly after that", async function () {
      const investables = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investables[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The first user deposits.
      await this.investHelper
        .deposit(this.investable, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits.
      await this.investHelper
        .deposit(this.investable, this.user1, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The third user deposits directly.
      await this.investHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // The first user withdraws.
      let availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.investable, this.user0, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user withdraws.
      availableTokenBalance = await this.investmentToken.balanceOf(this.user1.address)
      await this.investHelper
        .withdraw(this.investable, this.user1, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user1.address,
          params: [],
        })
        .success()

      // The third user withdraws directly.
      availableTokenBalance = await investableInvestmentToken.balanceOf(this.user2.address)
      await this.investHelper
        .withdraw(investable, this.user2, {
          amount: availableTokenBalance,
          depositTokenReceiver: this.user2.address,
          params: [],
        })
        .success()
    })
  })
}
