import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

export function testPortfolioUpgradeable() {
  describe("Upgradeable", async function () {
    it("should succeed when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.portfolio.address)

      const NewPortfolio = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newPortfolio = await upgrades.upgradeProxy(this.portfolio.address, NewPortfolio)
      await newPortfolio.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.portfolio.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should succeed when the portfolio is paused", async function () {
      expect(await this.portfolio.connect(this.owner).pause()).not.to.be.reverted

      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.portfolio.address)

      const NewPortfolio = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newPortfolio = await upgrades.upgradeProxy(this.portfolio.address, NewPortfolio)
      await newPortfolio.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.portfolio.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const NewPortfolio = await ethers.getContractFactory(this.upgradeTo, this.user0)
      await expect(upgrades.upgradeProxy(this.portfolio.address, NewPortfolio)).to.be.reverted
    })
  })
}
