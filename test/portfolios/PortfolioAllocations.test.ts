import { expect } from "chai"

export function testPortfolioAllocations() {
  describe("Allocations", async function () {
    it("should fail when the sum of target investable allocations is less than 100%", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      const allocations: number[] = [99000].concat(Array<number>(investableLength - 1).fill(0))

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalancePercentageNot100")
    })

    it("should fail when the sum of target investable allocations is bigger than 100%", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      const allocations: number[] = [101000].concat(Array<number>(investableLength - 1).fill(0))

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalancePercentageNot100")
    })

    it("should fail when the length of target investable allocations is shorter than the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length

      let allocations: number[]
      let customErrorName: string

      if (investableLength == 1) {
        allocations = []
        customErrorName = "RebalancePercentageNot100"
      } else {
        allocations = [100000].concat(Array<number>(investableLength - 2).fill(0))
        customErrorName = "RebalanceIncorrectAllocationsLength"
      }

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, customErrorName)
    })

    it("should fail when the length of target investable allocations is longer than the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      const allocations: number[] = [100000].concat(Array<number>(investableLength).fill(0))

      await expect(
        this.portfolio.connect(this.owner).setTargetInvestableAllocations(allocations)
      ).to.be.revertedWithCustomError(this.portfolio, "RebalanceIncorrectAllocationsLength")
    })

    it("should succeed when the sum of target investable allocations equals to 100% and the length of target investable allocations equals to the length of investables", async function () {
      const investableLength = (await this.portfolio.getInvestables()).length
      const allocations: number[] = [100000].concat(Array<number>(investableLength - 1).fill(0))

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
