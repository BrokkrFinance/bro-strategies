import { expect } from "chai"

export function testStrategyERC165() {
  describe("ERC165", async function () {
    it("should succeed to support all interfaces that strategy implements", async function () {
      expect(await this.strategy.supportsInterface("0x49147370")).to.equal(true) // IAum
      expect(await this.strategy.supportsInterface("0x52f3b8ca")).to.equal(true) // IFee
      expect(await this.strategy.supportsInterface("0x60145abe")).to.equal(true) // IInvestable
      expect(await this.strategy.supportsInterface("0xb7ac895f")).to.equal(true) // IReward
      expect(await this.strategy.supportsInterface("0x00000000")).to.equal(true) // IStrategy
    })

    it("should fail to support any interface that strategy doesn't implement", async function () {
      expect(await this.strategy.supportsInterface("0x7461375e")).to.equal(false) // IPortfolio
      expect(await this.strategy.supportsInterface("0x80ac58cd")).to.equal(false) // IERC 721
      expect(await this.strategy.supportsInterface("0xd9b67a26")).to.equal(false) // IERC 1155
      expect(await this.strategy.supportsInterface("0x36372b07")).to.equal(false) // IERC 20
    })
  })
}
