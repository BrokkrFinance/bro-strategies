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
        ethers.utils.parseUnits("10", this.depositTokenDecimals)
      )
    })

    it("should succeed when a single user deposits normal amount of `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals)
      )
    })

    it("should succeed when a single user deposits small amount of `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1", this.depositTokenDecimals)
      )
    })

    it("should succeed when a single user deposits small amount of `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1", this.depositTokenDecimals)
      )
    })

    it("should succeed when multiple users deposit `depositToken`", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1", this.depositTokenDecimals)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5.212", this.depositTokenDecimals)
      )
    })

    it("should succeed when multiple users deposit `depositToken` for other person", async function () {
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("1", this.depositTokenDecimals)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals)
      )
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("5.212", this.depositTokenDecimals)
      )
    })
  })
}
