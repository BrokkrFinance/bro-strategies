import { expect } from "chai"
import { ethers } from "hardhat"

export function testStrategyAccessControl() {
  describe("AccessControl", async function () {
    it("should fail when the non-owner user sets oracle", async function () {
      await expect(this.strategy.connect(this.user0).setOracle(this.user0.address)).to.be.reverted
    })

    it("should succeed when the owner user sets oracle", async function () {
      await expect(this.strategy.connect(this.owner).setOracle(this.user0.address)).not.to.be.reverted
    })

    it("should fail when the non-owner user sets swap route", async function () {
      await expect(
        this.strategy.connect(this.user0)["addSwapRoute(address,address,address,uint8,address)"](
          "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // wAVAX
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).to.be.reverted
    })

    it("should succeed when the owner user sets swap route", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,address,uint8,address)"](
          "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // wAVAX
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).not.to.be.reverted
    })

    it("should fail when the non-owner user sets whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.user0).addWhitelistedTokens([this.user0.address])).to.be.reverted
    })

    it("should succeed when the owner user sets whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.owner).addWhitelistedTokens([this.user0.address])).not.to.be.reverted
    })
  })
}
