import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

export function testStrategyUpgradeable() {
  describe("Upgradeable", async function () {
    it("should succeed when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newStrategy = await upgrades.upgradeProxy(this.strategy.address, NewStrategy)
      await newStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should succeed when the strategy is paused", async function () {
      expect(await this.strategy.connect(this.owner).pause()).not.to.be.reverted

      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newStrategy = await upgrades.upgradeProxy(this.strategy.address, NewStrategy)
      await newStrategy.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.strategy.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const NewStrategy = await ethers.getContractFactory(this.upgradeTo, this.user0)
      await expect(upgrades.upgradeProxy(this.strategy.address, NewStrategy)).to.be.reverted
    })
  })
}
