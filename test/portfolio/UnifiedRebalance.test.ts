import { expect } from "chai"
import { ethers } from "hardhat"
import investableAbi from "../shared/abi/investable.json"
import { getErrorRange } from "../shared/utils"

export function testRebalance() {
  describe("Rebalance", async function () {
    it("should success when the owner user rebalances - 0", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 100% to the first investable and 0% to the others. e.g. [100%, 0%, 0%]
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Set target allocations approximately equally. e.g. [33%, 33%, 34%]
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
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        const investableAddr = await investableDesc.investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
      }
    })

    it("should success when the owner user rebalances - 1", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()

      if (investableLength <= 1) {
        return
      }

      // Set target allocations 50% to the first and second investable and 0% to the others. e.g. [50%, 50%, 0%]
      let allocations: number[] = [50000, 50000]
      for (let i = 2; i < investableLength; i++) {
        allocations.push(0)
      }

      await this.portfolio.setTargetInvestableAllocations(allocations)

      // Deposit.
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("10000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("10000", 6), this.user0.address, [])

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Set target allocations approximately equally. e.g. [33%, 33%, 34%]
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
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("10000", 6))
      expect(await this.portfolio.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("10000", 6),
        getErrorRange(ethers.utils.parseUnits("10000", 6))
      )

      // Check if equity valuations of investables corresponds to the target allocations.
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        const investableAddr = await investableDesc.investable
        const investable = await ethers.getContractAt(investableAbi, investableAddr)

        const expectedValuation = ethers.utils.parseUnits("10000", 6).mul(allocations[i]).div(100000)
        expect(await investable.getEquityValuation(true, false)).to.be.approximately(
          expectedValuation,
          getErrorRange(expectedValuation)
        )
      }
    })
  })
}
