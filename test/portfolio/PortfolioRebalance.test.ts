import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import erc20Abi from "../helper/abi/erc20.json"
import investableAbi from "../helper/abi/investable.json"
import { getErrorRange } from "../helper/utils"

export function testPortfolioRebalance() {
  describe("Rebalance", async function () {
    it("should succeed when the owner user rebalances - for example [100%, 0%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 100% to the first investable and 0% to the others. for example [100%, 0%, 0%]
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // The first user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Set target allocations approximately equally. for example [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(
        await this.portfolio.connect(this.owner).rebalance(BigNumber.from(0), depositParams, withdrawParams)
      ).to.emit(this.portfolio, "Rebalance")

      // Check if equity valuations of investables corresponds to the target allocations.
      const investables = await this.portfolio.getInvestables()
      for (let i = 0; i < investables.length; i++) {
        const investableAddr = await investables[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils
          .parseUnits("10000", 6)
          .add(this.equityValuation)
          .mul(allocations[i])
          .div(100000)
        expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
      }
    })

    it("should succeed when the owner user rebalances - for example [50%, 50%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 50% to the first and second investable and 0% to the others. for example [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // The first user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Set target allocations approximately equally. for example [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(
        await this.portfolio.connect(this.owner).rebalance(BigNumber.from(0), depositParams, withdrawParams)
      ).to.emit(this.portfolio, "Rebalance")

      // Check if equity valuations of investables corresponds to the target allocations.
      const investables = await this.portfolio.getInvestables()
      for (let i = 0; i < investables.length; i++) {
        const investableAddr = await investables[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils
          .parseUnits("10000", 6)
          .add(this.equityValuation)
          .mul(allocations[i])
          .div(100000)
        expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
      }
    })

    it("should succeed when the owner user rebalances and another user deposits into investable directly -  for example [50%, 50%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      const investablesBefore = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investablesBefore[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The third user deposits directly.
      await this.investHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // Set target allocations 50% to the first and second investable and 0% to the others. for example [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // The first user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // Set target allocations approximately equally. for example [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(
        await this.portfolio.connect(this.owner).rebalance(BigNumber.from(0), depositParams, withdrawParams)
      ).to.emit(this.portfolio, "Rebalance")

      // Check if equity valuations of investables corresponds to the target allocations.
      const investablesAfter = await this.portfolio.getInvestables()
      for (let i = 0; i < investablesAfter.length; i++) {
        const investableAddr = await investablesAfter[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils
          .parseUnits("10000", 6)
          .add(this.equityValuation)
          .mul(allocations[i])
          .div(100000)
        const directlyDepositedAmount = i == 0 ? ethers.utils.parseUnits("3000", 6) : BigNumber.from(0)
        expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
          expectedValuation.add(directlyDepositedAmount),
          getErrorRange(expectedValuation.add(directlyDepositedAmount))
        )
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation.add(directlyDepositedAmount),
          getErrorRange(expectedValuation.add(directlyDepositedAmount))
        )
      }
    })

    it("should succeed when the owner user rebalances and another user withdraws from investable directly - for example [50%, 50%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      const investablesBefore = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investablesBefore[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      // The third user deposits directly.
      await this.investHelper
        .deposit(investable, this.user2, {
          amount: ethers.utils.parseUnits("3000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // Set target allocations 50% to the first and second investable and 0% to the others. for example [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // The first user deposits.
      await this.investHelper
        .deposit(this.portfolio, this.user0, {
          amount: ethers.utils.parseUnits("10000", 6),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          investmentTokenReceiver: this.user0.address,
          params: [],
        })
        .success()

      // The third user withdraws directly.
      const availableTokenBalance = await investableInvestmentToken.balanceOf(this.user2.address)
      await this.investHelper
        .withdraw(investable, this.user2, {
          amount: availableTokenBalance.div(2),
          minimumDepositTokenAmountOut: BigNumber.from(0),
          depositTokenReceiver: this.user2.address,
          params: [],
        })
        .success()

      // Set target allocations approximately equally. for example [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(
        await this.portfolio.connect(this.owner).rebalance(BigNumber.from(0), depositParams, withdrawParams)
      ).to.emit(this.portfolio, "Rebalance")

      // Check if equity valuations of investables corresponds to the target allocations.
      const investablesAfter = await this.portfolio.getInvestables()
      for (let i = 0; i < investablesAfter.length; i++) {
        const investableAddr = await investablesAfter[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils
          .parseUnits("10000", 6)
          .add(this.equityValuation)
          .mul(allocations[i])
          .div(100000)
        const directlyDepositedAmount = i == 0 ? ethers.utils.parseUnits("1500", 6) : BigNumber.from(0)
        expect(await investable.getInvestmentTokenSupply()).to.be.approximately(
          expectedValuation.add(directlyDepositedAmount),
          getErrorRange(expectedValuation.add(directlyDepositedAmount))
        )
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation.add(directlyDepositedAmount),
          getErrorRange(expectedValuation.add(directlyDepositedAmount))
        )
      }
    })
  })
}
