import { expect } from "chai"

export function testAllocations() {
  describe("Allocations", async function () {
    it("should fail when the sum of target investable allocations is less than 100%", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [99000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalancePercentageNot100")
    })

    it("should fail when the sum of target investable allocations is bigger than 100%", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [101000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalancePercentageNot100")
    })

    it("should fail when the length of target investable allocations is shorter than the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalanceIncorrectAllocationsLength")
    })

    it("should fail when the length of target investable allocations is longer than the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalanceIncorrectAllocationsLength")
    })

    it("should succeed when the sum of target investable allocations equals to 100% and the length of target investable allocations equals to the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }
      expect(await this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations))
        .to.emit(this.portfolio, "TargetInvestableAllocationsSet")
        .withArgs(allocations)

      const investables = await this.portfolio.getInvestables()
      expect(investables.length).to.be.equal(investableLength)
      for (const [i, investable] of investables.entries()) {
        expect(await investable.allocationPercentage).to.be.equal(allocations[i])
      }
    })
  })
}
