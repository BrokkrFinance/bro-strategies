import { expect } from "chai"

export function testERC165() {
  describe("ERC165", async function () {
    it("should success to support all interfaces that strategy inherits", async function () {
      expect(await this.strategy.supportsInterface("0x49147370")).to.equal(true) // IAum
      expect(await this.strategy.supportsInterface("0x52f3b8ca")).to.equal(true) // IFee
      expect(await this.strategy.supportsInterface("0xa9233731")).to.equal(true) // IInvestable
      expect(await this.strategy.supportsInterface("0xb7ac895f")).to.equal(true) // IReward
      expect(await this.strategy.supportsInterface("0x00000000")).to.equal(true) // IStrategy
    })
  })
}
