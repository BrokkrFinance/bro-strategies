import { setBalance } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

export function testStrategyOracle() {
  describe("Oracle", async function () {
    it("should fail when the non-owner sets price feed", async function () {
      await expect(this.oracle.connect(this.user0).setPriceFeed(this.depositToken.address, this.depositToken.address))
        .to.be.reverted
    })

    it("should success when the owner sets price feed", async function () {
      const ownerAddr = await this.oracle.owner()
      const owner = await ethers.getImpersonatedSigner(ownerAddr)
      await setBalance(owner.address, ethers.utils.parseEther("10000"))

      await expect(this.oracle.connect(owner).setPriceFeed(this.depositToken.address, this.depositToken.address)).not.to
        .be.reverted
    })

    it("should success to query getPrice", async function () {
      expect(await this.oracle.connect(this.user0).getPrice(this.wNATIVE, true, true)).not.to.be.reverted
    })

    it("should success to query getPrices", async function () {
      expect(await this.oracle.connect(this.user0).getPrices([this.wNATIVE, this.wNATIVE], true, true)).not.to.be
        .reverted
    })
  })
}
