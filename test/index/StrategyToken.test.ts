import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { defaultAffiliatorAddress } from "../helper/constants"

export function testStrategyToken() {
  describe("Token", async function () {
    beforeEach(async function () {
      // Get token factory.
      const Token = await ethers.getContractFactory("IndexToken")

      // Deploy token.
      this.token = await upgrades.deployProxy(Token, ["Index Token Name", "Index Token Symbol"], {
        kind: "uups",
        unsafeAllow: ["external-library-linking"],
      })
      await this.token.deployed()

      // Transfer ownership of token to owner.
      await this.token.transferOwnership(this.owner.address)
    })

    it("should succeed when the owner sets name and symbol", async function () {
      await this.token.connect(this.owner).setName("Index Token Name")
      await this.token.connect(this.owner).setSymbol("ITN")

      expect(await this.token.name()).to.equal("Index Token Name")
      expect(await this.token.symbol()).to.equal("ITN")
    })

    it("should fail when the non-owner sets name and symbol", async function () {
      await expect(this.token.connect(this.user0).setName("Some")).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
      await expect(this.token.connect(this.user0).setSymbol("Some")).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })

    it("should have 18 decimals", async function () {
      expect(await this.token.decimals()).to.equal(18)
    })

    it("should succeed when the owner user upgrades", async function () {
      const addr_before_upgrade = await upgrades.erc1967.getImplementationAddress(this.token.address)

      const NewToken = await ethers.getContractFactory(this.upgradeTo, this.owner)
      const newToken = await upgrades.upgradeProxy(this.token.address, NewToken, {
        unsafeSkipStorageCheck: true,
      })
      await newToken.deployed()

      const addr_after_upgrade = await upgrades.erc1967.getImplementationAddress(this.token.address)

      expect(addr_before_upgrade != addr_after_upgrade).to.equal(true)
    })

    it("should fail when the non-owner user upgrades", async function () {
      const NewToken = await ethers.getContractFactory(this.upgradeTo, this.user0)
      await expect(
        upgrades.upgradeProxy(this.token.address, NewToken, {
          unsafeSkipStorageCheck: true,
        })
      ).to.be.reverted
    })

    it("should fail when initialize function is called after it's initialized", async function () {
      await expect(this.token.initialize("Index Token Name", "ITN")).to.be.reverted
    })

    it("should succeed when the owner user mints and burns token", async function () {
      const balance_before_mint = await this.token.balanceOf(this.owner.address)

      await this.token.connect(this.owner).mint(this.owner.address, "1000")

      const balance_after_mint = await this.token.balanceOf(this.owner.address)

      expect(balance_after_mint.sub(balance_before_mint)).to.equal("1000")

      await this.token.connect(this.owner).burn("1000")

      const balance_after_burn = await this.token.balanceOf(this.owner.address)

      expect(balance_after_burn).to.equal(balance_before_mint)
    })

    it("should fail when the non-owner user mints token", async function () {
      await expect(this.token.connect(this.user0).mint(this.owner.address, "1000")).to.be.revertedWith(
        "Ownable: caller is not the owner"
      )
    })
  })
}
