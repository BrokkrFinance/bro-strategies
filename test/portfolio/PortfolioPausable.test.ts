import { expect } from "chai"
import { ethers } from "hardhat"

export function testPausable() {
  describe("Pausable", async function () {
    it("should fail when the non-owner user pauses", async function () {
      await expect(this.portfolio.connect(this.user0).pause()).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("should fail when any user deposits and the portfolio is paused", async function () {
      expect(await this.portfolio.connect(this.owner).pause()).not.to.be.reverted

      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      ).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("10000", 6))
    })

    it("should fail when any user withdraws and the portfolio is paused", async function () {
      await this.usdc.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await this.portfolio.connect(this.user0).deposit(ethers.utils.parseUnits("3000", 6), this.user0.address, [])

      expect(await this.portfolio.connect(this.owner).pause()).not.to.be.reverted

      await this.investmentToken.connect(this.user0).approve(this.portfolio.address, ethers.utils.parseUnits("3000", 6))
      await expect(
        this.portfolio.connect(this.user0).withdraw(ethers.utils.parseUnits("3000", 6), this.user0.address, [])
      ).to.be.revertedWith("Pausable: paused")

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("7000", 6))
    })
  })
}
