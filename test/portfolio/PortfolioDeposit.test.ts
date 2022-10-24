import { expect } from "chai"
import { ethers } from "hardhat"
import investableAbi from "../helper/abi/investable.json"
import { getErrorRange } from "../helper/utils"
import { testDeposit } from "../shared/Deposit.test"

export function testPortfolioDeposit() {
  describe("Deposit - Portfolio", async function () {
    testDeposit()

    it("should succeed when a single user deposits USDC that he/she has and another user deposited into investable directly before that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

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
        .deposit(this.portfolio, this.user0, {
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
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
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
    })

    it("should succeed when multiple users deposit USDC that they have and another user deposited into investable directly before that", async function () {
      const investableDecs = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investableDecs[0].investable)

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
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user1, {
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
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The second user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user1, {
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
    })

    it("should succeed after a single deposit", async function () {
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)

      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("3000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)

      const investableDescs = await this.portfolio.getInvestables()

      for (const [i, investableDesc] of investableDescs.entries()) {
        const investableAddr = await investableDesc.investable
        const allocationPercentage = await investableDesc.allocationPercentage

        const investable = await ethers.getContractAt(investableAbi, investableAddr)
        const investableDepositAmount = ethers.utils.parseUnits("3000", 6).mul(allocationPercentage).div(1e5)

        expect(assetBalancesAfter[i].asset).to.equal(await investable.getInvestmentToken())
        expect(assetBalancesAfter[i].balance).to.approximately(
          investableDepositAmount.add(assetBalancesBefore[i].balance),
          getErrorRange(investableDepositAmount.add(assetBalancesBefore[i].balance))
        )
        expect(assetValuationsAfter[i].asset).to.equal(investableAddr)
        expect(assetValuationsAfter[i].valuation).to.approximately(
          investableDepositAmount.add(assetValuationsBefore[i].valuation),
          getErrorRange(investableDepositAmount.add(assetValuationsBefore[i].valuation))
        )
      }

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty
    })

    it("should succeed after multiple deposits and withdrawals", async function () {
      const assetBalancesBefore = await this.portfolio.getAssetBalances()
      const assetValuationsBefore = await this.portfolio.getAssetValuations(true, false)

      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("5000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const availableTokenBalance = await this.investmentToken.balanceOf(this.user0.address)
      await this.investHelper
        .withdraw(this.portfolio, this.user0, {
          amount: availableTokenBalance.div(2),
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("5000", 6),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      await this.investHelper
        .withdraw(this.portfolio, this.user0, {
          amount: availableTokenBalance.div(2),
          depositTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      const assetBalancesAfter = await this.portfolio.getAssetBalances()
      const assetValuationsAfter = await this.portfolio.getAssetValuations(true, false)

      const investableDescs = await this.portfolio.getInvestables()

      for (const [i, investableDesc] of investableDescs.entries()) {
        const investableAddr = await investableDesc.investable
        const allocationPercentage = await investableDesc.allocationPercentage

        const investable = await ethers.getContractAt(investableAbi, investableAddr)
        const investableDepositAmount = ethers.utils.parseUnits("5000", 6).mul(allocationPercentage).div(1e5)

        expect(assetBalancesAfter[i].asset).to.equal(await investable.getInvestmentToken())
        expect(assetBalancesAfter[i].balance).to.approximately(
          investableDepositAmount.add(assetBalancesBefore[i].balance),
          getErrorRange(investableDepositAmount.add(assetBalancesBefore[i].balance))
        )
        expect(assetValuationsAfter[i].asset).to.equal(investableAddr)
        expect(assetValuationsAfter[i].valuation).to.approximately(
          investableDepositAmount.add(assetValuationsBefore[i].valuation),
          getErrorRange(investableDepositAmount.add(assetValuationsBefore[i].valuation))
        )
      }

      expect(await this.portfolio.getLiabilityBalances()).to.be.an("array").that.is.empty
    })
  })
}
