import { expect } from "chai"
import { ethers } from "hardhat"
import { getErrorRange, getMonthsInSeconds } from "../shared/utils"

export function testInvestable() {
  describe("Investable", async function () {
    it("should fail to add when the investable already exists", async function () {
      const investableDesc = await this.portfolio.investableDescs(0)
      const investableAddr = await investableDesc.investable

      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.addInvestable(investableAddr, allocations, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "InvestableAlreadyAdded"
      )
    })

    it("should success to add when the investable not exists", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      expect(await this.portfolio.addInvestable(this.usdc.address, allocations, []))
        .to.emit(this.portfolio, "InvestableAdd")
        .withArgs(this.usdc.address, allocations, [])

      expect(await this.portfolio.investableLength()).to.be.equal(investableLength + 1)
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        expect(await investableDesc.allocationPercentage).to.be.equal(allocations[i])
      }
    })

    it("should fail to remove when the investable not exists", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.removeInvestable(this.usdc.address, allocations, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "InvestableNotYetAdded"
      )
    })

    it("should fail to remove when the investable has non-zero allocation", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      const investableDesc = await this.portfolio.investableDescs(0)
      const investableAddr = await investableDesc.investable

      await expect(this.portfolio.removeInvestable(investableAddr, allocations, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "InvestableHasNonZeroAllocation"
      )
    })

    it("should success to remove when the investable exists and has zero allocation", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()

      if (investableLength <= 1) {
        return
      }

      let allocations: number[] = [0]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }
      allocations.push(100000)

      expect(await this.portfolio.setTargetInvestableAllocations(allocations)).not.to.be.reverted

      const investableDesc = await this.portfolio.investableDescs(0)
      const investableAddr = await investableDesc.investable

      allocations.pop()
      allocations[allocations.length - 1] = 100000

      expect(await this.portfolio.removeInvestable(investableAddr, allocations, []))
        .to.emit(this.portfolio, "InvestableRemove")
        .withArgs(investableAddr, allocations, [])

      expect(await this.portfolio.investableLength()).to.be.equal(investableLength - 1)
      for (let i = 0; i < investableLength - 1; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        expect(await investableDesc.allocationPercentage).to.be.equal(allocations[i])
      }
    })

    it("should fail to change when the investable not exists", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.changeInvestable(this.usdc.address, [])).to.be.revertedWithCustomError(
        this.portfolio,
        "InvestableNotYetAdded"
      )
    })

    it("should success to change when the investable exists", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      const investableDesc = await this.portfolio.investableDescs(0)
      const investableAddr = await investableDesc.investable

      let allocations: number[] = []
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        allocations.push(await investableDesc.allocationPercentage)
      }

      expect(await this.portfolio.changeInvestable(investableAddr, []))
        .to.emit(this.portfolio, "InvestableChange")
        .withArgs(investableAddr, [])

      expect((await this.portfolio.investableLength()).toNumber()).to.be.equal(investableLength)
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        expect(await investableDesc.allocationPercentage).to.be.equal(allocations[i])
      }
    })
  })
}
