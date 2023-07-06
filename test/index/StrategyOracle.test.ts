import { expect } from "chai"
import { ethers, upgrades } from "hardhat"

export function testStrategyOracle() {
  describe("Oracle", async function () {
    beforeEach(async function () {
      // Get oracle factory.
      const Oracle = await ethers.getContractFactory(this.oracleName)

      // Deploy oracle.
      this.oracle = await upgrades.deployProxy(Oracle, [this.oracleWETH, this.oracleWETHPriceFeed], {
        kind: "uups",
        unsafeAllow: ["external-library-linking"],
      })
      await this.oracle.deployed()

      // Transfer ownership of oracle to owner.
      await this.oracle.transferOwnership(this.owner.address)
    })

    it("should fail when the non-owner sets price feed", async function () {
      await expect(this.oracle.connect(this.user0).setPriceFeed(this.depositTokenAddress, this.depositTokenAddress)).to
        .be.reverted
    })

    it("should success when the owner sets price feed", async function () {
      await expect(this.oracle.connect(this.owner).setPriceFeed(this.depositTokenAddress, this.depositTokenAddress)).not
        .to.be.reverted
    })

    it("should fail when the price feed is zero address", async function () {
      await expect(
        this.oracle
          .connect(this.owner)
          .setPriceFeed("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")
      ).to.be.reverted
    })

    it("should success to query getPrice", async function () {
      expect(await this.oracle.connect(this.user0).getPrice(this.wNATIVE, true, true)).not.to.be.reverted
      expect(await this.oracle.connect(this.user0).getPrice(this.wNATIVE, true, false)).not.to.be.reverted
      expect(await this.oracle.connect(this.user0).getPrice(this.wNATIVE, false, true)).not.to.be.reverted
      expect(await this.oracle.connect(this.user0).getPrice(this.wNATIVE, false, false)).not.to.be.reverted
    })

    it("should success to query getPrices", async function () {
      expect(await this.oracle.connect(this.user0).getPrices([this.wNATIVE, this.wNATIVE], true, true)).not.to.be
        .reverted
      expect(await this.oracle.connect(this.user0).getPrices([this.wNATIVE, this.wNATIVE], true, false)).not.to.be
        .reverted
      expect(await this.oracle.connect(this.user0).getPrices([this.wNATIVE, this.wNATIVE], false, true)).not.to.be
        .reverted
      expect(await this.oracle.connect(this.user0).getPrices([this.wNATIVE, this.wNATIVE], false, false)).not.to.be
        .reverted
    })

    it("should fail to query getPrice when the token is not added", async function () {
      await expect(this.oracle.connect(this.user0).getPrice("0x0000000000000000000000000000000000000000", true, true))
        .to.be.reverted
      await expect(this.oracle.connect(this.user0).getPrice("0x0000000000000000000000000000000000000000", true, false))
        .to.be.reverted
      await expect(this.oracle.connect(this.user0).getPrice("0x0000000000000000000000000000000000000000", false, true))
        .to.be.reverted
      await expect(this.oracle.connect(this.user0).getPrice("0x0000000000000000000000000000000000000000", false, false))
        .to.be.reverted
    })

    it("should fail to query getPrices when the token is not added", async function () {
      await expect(
        this.oracle
          .connect(this.user0)
          .getPrices(
            ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"],
            true,
            true
          )
      ).to.be.reverted
      await expect(
        this.oracle
          .connect(this.user0)
          .getPrices(
            ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"],
            true,
            false
          )
      ).to.be.reverted
      await expect(
        this.oracle
          .connect(this.user0)
          .getPrices(
            ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"],
            false,
            true
          )
      ).to.be.reverted
      await expect(
        this.oracle
          .connect(this.user0)
          .getPrices(
            ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"],
            false,
            false
          )
      ).to.be.reverted
    })

    it("should succeed when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.oracle.address)

      const NewOracle = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newOracle = await upgrades.upgradeProxy(this.oracle.address, NewOracle, {
        unsafeSkipStorageCheck: true,
      })
      await newOracle.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.oracle.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const NewOracle = await ethers.getContractFactory(this.upgradeTo, this.user0)
      await expect(
        upgrades.upgradeProxy(this.oracle.address, NewOracle, {
          unsafeSkipStorageCheck: true,
        })
      ).to.be.reverted
    })

    it("should fail when initialize function is called after it's initialized", async function () {
      await expect(
        this.oracle.initialize(
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
        )
      ).to.be.reverted
    })

    it("should have 8 decimals", async function () {
      expect(await this.oracle.decimals()).to.equal(8)
    })
  })
}
