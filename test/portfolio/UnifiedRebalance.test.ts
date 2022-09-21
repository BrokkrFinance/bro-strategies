import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import erc20Abi from "../shared/abi/erc20.json"
import investableAbi from "../shared/abi/investable.json"
import { getErrorRange } from "../shared/utils"

export function testRebalance() {
  describe("Rebalance", async function () {
    it("should succeed when the owner user rebalances - [100%, 0%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 100% to the first investable and 0% to the others. [100%, 0%, 0%]
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Set target allocations approximately equally. [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(await this.portfolio.rebalance(depositParams, withdrawParams)).to.emit(this.portfolio, "Rebalance")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      const investables = await this.portfolio.getInvestables()
      for (let i = 0; i < investables.length; i++) {
        const investableAddr = await investables[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
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

    it("should succeed when the owner user rebalances - [50%, 50%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 50% to the first and second investable and 0% to the others. [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Set target allocations approximately equally. [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(await this.portfolio.rebalance(depositParams, withdrawParams)).to.emit(this.portfolio, "Rebalance")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      const investables = await this.portfolio.getInvestables()
      for (let i = 0; i < investables.length; i++) {
        const investableAddr = await investables[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
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

    it("should succeed when the owner user rebalances and another user deposits into investable directly - [50%, 50%, 0%] -> [33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      const investablesBefore = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investablesBefore[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // Set target allocations 50% to the first and second investable and 0% to the others. [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Set target allocations approximately equally. [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(await this.portfolio.rebalance(depositParams, withdrawParams)).to.emit(this.portfolio, "Rebalance")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("7000", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("3000", 6),
        getErrorRange(ethers.utils.parseUnits("3000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      const investablesAfter = await this.portfolio.getInvestables()
      for (let i = 0; i < investablesAfter.length; i++) {
        const investableAddr = await investablesAfter[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
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

    it("should succeed when the owner user rebalances and another user withdraws from investable directly - [50%, 50%, 0%] ->[33%, 33%, 34%]", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      const investablesBefore = await this.portfolio.getInvestables()
      const investable = await ethers.getContractAt(investableAbi, await investablesBefore[0].investable)
      const investableInvestmentToken = await ethers.getContractAt(erc20Abi, await investable.getInvestmentToken())

      await this.usdc.connect(this.user2).approve(investable.address, ethers.utils.parseUnits("3000", 6))
      await expect(investable.connect(this.user2).deposit(ethers.utils.parseUnits("3000", 6), this.user2.address, []))
        .not.to.be.reverted

      // Set target allocations 50% to the first and second investable and 0% to the others. [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      await investableInvestmentToken
        .connect(this.user2)
        .approve(investable.address, ethers.utils.parseUnits("1500", 6))
      await expect(investable.connect(this.user2).withdraw(ethers.utils.parseUnits("1500", 6), this.user2.address, []))
        .not.to.be.reverted

      // Set target allocations approximately equally. [33%, 33%, 34%]
      allocations = []
      const equalAllocation = Math.floor(100 / investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        allocations.push(equalAllocation * 1000)
      }
      const remainingAllocation = 100 - equalAllocation * (investableLength - 1)
      allocations.push(remainingAllocation * 1000)

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Rebalance.
      let depositParams: any[] = []
      let withdrawParams: any[] = []
      for (let i = 0; i < investableLength; i++) {
        depositParams.push([])
        withdrawParams.push([])
      }

      expect(await this.portfolio.rebalance(depositParams, withdrawParams)).to.emit(this.portfolio, "Rebalance")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.usdc.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("8500", 6),
        getErrorRange(ethers.utils.parseUnits("8500", 6))
      )
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await investableInvestmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("1500", 6),
        getErrorRange(ethers.utils.parseUnits("1500", 6))
      )
      expect(await this.portfolio.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      const investablesAfter = await this.portfolio.getInvestables()
      for (let i = 0; i < investablesAfter.length; i++) {
        const investableAddr = await investablesAfter[i].investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
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
