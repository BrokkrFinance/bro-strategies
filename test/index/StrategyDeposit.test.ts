import { ethers } from "hardhat"
import { mint } from "./helper/InvestHelper"

export function testStrategyDeposit() {
  describe("Deposit", async function () {
    it("should succeed when a single user deposits normal amount of `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )
    })

    it("should succeed when a single user deposits normal amount of `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )
    })

    it("should succeed when a single user deposits small amount of `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1", 6)
      )
    })

    it("should succeed when a single user deposits small amount of `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1", 6)
      )
    })

    it("should succeed when a single user deposits large amount of `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        this.depositToken.balanceOf(this.user0.address)
      )
    })

    it("should succeed when a single user deposits large amount of `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        this.depositToken.balanceOf(this.user0.address)
      )
    })

    it("should succeed when multiple users deposit `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1", 6)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("100", 6)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5012.12", 6)
      )
    })

    it("should succeed when multiple users deposit `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1", 6)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("100", 6)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("5012.12", 6)
      )
    })
  })
}
