import { expect } from "chai"

export function testInvestable() {
  describe("Investable", async function () {
    it("should fail to add when the investable already exists", async function () {
      const investables = await this.portfolio.getInvestables()
      const investableAddr = await investables[0].investable

      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).addInvestable(investableAddr, allocations, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestableAlreadyAdded")
    })

    it("should succeed to add when the investable not exists", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      expect(await this.portfolio.connect(this.owner).addInvestable(this.usdc.address, allocations, []))
        .to.emit(this.portfolio, "InvestableAdd")
        .withArgs(this.usdc.address, allocations, [])

      const investables = await this.portfolio.getInvestables()
      expect(investables.length).to.be.equal(investableLength + 1)
      for (let i = 0; i < investables.length; i++) {
        expect(await investables[i].allocationPercentage).to.be.equal(allocations[i])
      }
    })

    it("should fail to remove when the investable not exists", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).removeInvestable(this.usdc.address, allocations, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestableNotYetAdded")
    })

    it("should fail to remove when the investable has non-zero allocation", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      const investables = await this.portfolio.getInvestables()
      const investableAddr = await investables[0].investable

      await expect(
        this.portfolio.connect(this.owner).removeInvestable(investableAddr, allocations, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestableHasNonZeroAllocation")
    })

    it("should succeed to remove when the investable exists and has zero allocation", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      if (investableLength <= 1) {
        return
      }

      let allocations: number[] = [0]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }
      allocations.push(100000)

      expect(await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)).not.to.be.reverted

      const investablesBefore = await this.portfolio.getInvestables()
      const investableAddr = await investablesBefore[0].investable

      allocations.pop()
      allocations[allocations.length - 1] = 100000

      expect(await this.portfolio.connect(this.owner).removeInvestable(investableAddr, allocations, []))
        .to.emit(this.portfolio, "InvestableRemove")
        .withArgs(investableAddr, allocations, [])

      const investablesAfter = await this.portfolio.getInvestables()
      expect(investablesAfter.length).to.be.equal(investableLength - 1)
      for (let i = 0; i < investablesAfter.length - 1; i++) {
        expect(await investablesAfter[i].allocationPercentage).to.be.equal(allocations[i])
      }
    })

    it("should fail to change when the investable not exists", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).changeInvestable(this.usdc.address, [])
      ).to.be.revertedWithCustomError(this.portfolio, "InvestableNotYetAdded")
    })

    it("should succeed to change when the investable exists", async function () {
      const investablesBefore = await this.portfolio.getInvestables()
      const investableAddr = await investablesBefore[0].investable

      let allocations: number[] = []
      for (let i = 0; i < investablesBefore.length; i++) {
        allocations.push(await investablesBefore[i].allocationPercentage)
      }

      expect(await this.portfolio.connect(this.owner).changeInvestable(investableAddr, []))
        .to.emit(this.portfolio, "InvestableChange")
        .withArgs(investableAddr, [])

      const investablesAfter = await this.portfolio.getInvestables()
      expect(investablesAfter.length).to.be.equal(investablesBefore.length)
      for (let i = 0; i < investablesAfter.length; i++) {
        expect(await investablesAfter[i].allocationPercentage).to.be.equal(allocations[i])
      }
    })
  })
}
