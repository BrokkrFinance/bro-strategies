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

    it("should fail when the non-owner user adds swap route", async function () {
      await expect(
        this.strategy.connect(this.user0)["addSwapRoute(address,address,uint8,address)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).to.be.reverted
    })

    it("should succeed when the owner user adds swap route", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).not.to.be.reverted
    })

    it("should fail when the non-owner user removes swap route", async function () {
      // Add a swap route to be removed right after.
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.user0).removeSwapRoute(
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106" // Pangolin Router
        )
      ).to.be.reverted
    })

    it("should succeed when the owner user removes swap route", async function () {
      // Add a swap route to be removed right after.
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.utils.solidityPack(["uint8"], [0]),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner).removeSwapRoute(
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106" // Pangolin Router
        )
      ).not.to.be.reverted
    })

    it("should fail when the non-owner user adds whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.user0).addWhitelistedTokens([this.user0.address])).to.be.reverted
    })

    it("should succeed when the owner user adds whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.owner).addWhitelistedTokens([this.user0.address])).not.to.be.reverted
    })

    it("should fail when the non-owner user removes whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.user0).removeWhitelistedTokens([this.user0.address])).to.be.reverted
    })

    it("should succeed when the owner user removes whitelisted tokens", async function () {
      await expect(this.strategy.connect(this.owner).addWhitelistedTokens([this.user0.address])).not.to.be.reverted
    })

    it("should succeed when the owner user adds and removes whitelisted tokens", async function () {
      const whitelistedTokens: string[] = Object.assign([], await this.strategy.allWhitelistedTokens())

      whitelistedTokens.push(this.user0.address)
      whitelistedTokens.push(this.user1.address)
      whitelistedTokens.push(this.user2.address)

      await expect(
        this.strategy
          .connect(this.owner)
          .addWhitelistedTokens([this.user0.address, this.user1.address, this.user2.address])
      ).not.to.be.reverted

      expect(await this.strategy.allWhitelistedTokens()).to.have.members(whitelistedTokens)

      let index = whitelistedTokens.indexOf(this.user0.address)
      whitelistedTokens[index] = whitelistedTokens[whitelistedTokens.length - 1]
      whitelistedTokens.pop()

      await expect(this.strategy.connect(this.owner).removeWhitelistedTokens([this.user0.address])).not.to.be.reverted

      expect(await this.strategy.allWhitelistedTokens()).to.have.members(whitelistedTokens)

      index = whitelistedTokens.indexOf(this.user1.address)
      whitelistedTokens[index] = whitelistedTokens[whitelistedTokens.length - 1]
      whitelistedTokens.pop()

      await expect(this.strategy.connect(this.owner).removeWhitelistedTokens([this.user1.address])).not.to.be.reverted

      expect(await this.strategy.allWhitelistedTokens()).to.have.members(whitelistedTokens)
    })
  })
}
