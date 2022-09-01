import { expect } from "chai"

export function testERC165() {
  describe("ERC165", async function () {
    it("should success to support all interfaces that portfolio implements", async function () {
      expect(await this.portfolio.supportsInterface("0x49147370")).to.equal(true) // IAum
      expect(await this.portfolio.supportsInterface("0x52f3b8ca")).to.equal(true) // IFee
      expect(await this.portfolio.supportsInterface("0xa9233731")).to.equal(true) // IInvestable
      expect(await this.portfolio.supportsInterface("0x9f4acf28")).to.equal(true) // IPortfolio
    })

    it("should fail to support any interface that portfolio doesn't implement", async function () {
      expect(await this.portfolio.supportsInterface("0xb7ac895f")).to.equal(false) // IReward
      expect(await this.portfolio.supportsInterface("0x00000000")).to.equal(false) // IStrategy
      expect(await this.portfolio.supportsInterface("0x80ac58cd")).to.equal(false) // IERC 721
      expect(await this.portfolio.supportsInterface("0xd9b67a26")).to.equal(false) // IERC 1155
      expect(await this.portfolio.supportsInterface("0x36372b07")).to.equal(false) // IERC 20
    })
  })
}
