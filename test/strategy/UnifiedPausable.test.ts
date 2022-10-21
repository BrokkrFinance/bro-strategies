import { expect } from "chai"
import { ethers } from "hardhat"
import { airdropToken } from "../helper/utils"

export function testPausable() {
  describe("Pausable", async function () {
    it("should fail when the non-owner user pauses", async function () {
      await expect(this.strategy.connect(this.user0).pause()).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("should fail when any user deposits and the strategy is paused", async function () {
      expect(await this.strategy.pause()).not.to.be.reverted

      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(
        this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])
      ).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("100", 6))
    })

    it("should fail when any user withdraws and the strategy is paused", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      expect(await this.strategy.pause()).not.to.be.reverted

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(
        this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("30", 6), this.user0.address, [])
      ).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("70", 6))
    })

    it("should fail when any user withdraws reward and the strategy is paused", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, [])

      expect(await this.strategy.pause()).not.to.be.reverted

      await expect(this.strategy.connect(this.user0).withdrawReward([])).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("70", 6))
    })
  })
}
