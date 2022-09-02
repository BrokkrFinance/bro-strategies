import { expect } from "chai"

export function testAllocations() {
  describe("Allocations", async function () {
    it("should fail when the sum of target investable allocations is less than 100%", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [99000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.setTargetInvestableAllocations(allocations)).to.be.revertedWithCustomError(
        this.portfolio,
        "RebalancePercentageNot100"
      )
    })

    it("should fail when the sum of target investable allocations is bigger than 100%", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [101000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.setTargetInvestableAllocations(allocations)).to.be.revertedWithCustomError(
        this.portfolio,
        "RebalancePercentageNot100"
      )
    })

    it("should fail when the length of target investable allocations is shorter than the length of investables", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength - 1; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.setTargetInvestableAllocations(allocations)).to.be.revertedWithCustomError(
        this.portfolio,
        "RebalanceIncorrectAllocationsLength"
      )
    })

    it("should fail when the length of target investable allocations is longer than the length of investables", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength + 1; i++) {
        allocations.push(0)
      }

      await expect(this.portfolio.setTargetInvestableAllocations(allocations)).to.be.revertedWithCustomError(
        this.portfolio,
        "RebalanceIncorrectAllocationsLength"
      )
    })

    it("should success when the sum of target investable allocations equals to 100% and the length of target investable allocations equals to the length of investables", async function () {
      const investableLength = (await this.portfolio.investableLength()).toNumber()
      let allocations: number[] = [100000]
      for (let i = 1; i < investableLength; i++) {
        allocations.push(0)
      }
      expect(await this.portfolio.setTargetInvestableAllocations(allocations))
        .to.emit(this.portfolio, "TargetInvestableAllocationsSet")
        .withArgs(allocations)

      expect((await this.portfolio.investableLength()).toNumber()).to.be.equal(investableLength)
      for (let i = 0; i < investableLength; i++) {
        const investableDesc = await this.portfolio.investableDescs(i)
        expect(await investableDesc.allocationPercentage).to.be.equal(allocations[i])
      }
    })
  })
}
