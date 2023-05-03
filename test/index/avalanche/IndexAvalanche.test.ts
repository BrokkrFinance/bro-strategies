import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import Avalanche from "../../../constants/networks/Avalanche.json"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { upgradeStrategy } from "../../../scripts/contracts/forking/upgrade"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"
import { burn, mint } from "../helper/InvestHelper"

const indexAvalancheTestOptions: IndexTestOptions = {
  network: Avalanche,
  forkAt: 29197000,
}

testStrategy("IndexAvalancheDeFi Strategy - Deploy", deployIndexAvalancheDeFiStrategy, indexAvalancheTestOptions, [
  testIndexAvalancheAddSwapRoute,
])
testStrategy(
  "IndexAvalancheGamingNFT Strategy - Deploy",
  deployIndexAvalancheGamingNFTStrategy,
  indexAvalancheTestOptions,
  [testIndexAvalancheAddSwapRoute]
)
// testStrategy(
//   "IndexAvalancheDeFi Strategy - Upgrade After Deploy",
//   upgradeIndexAvalancheDeFiStrategy,
//   indexAvalancheTestOptions,
//   [testIndexAvalancheAddSwapRoute, testIndexAvalancheRemoveSwapRoute]
// )

async function deployIndexAvalancheDeFiStrategy() {
  return await deployStrategy("avalanche", "IndexAvalancheDeFi")
}

async function deployIndexAvalancheGamingNFTStrategy() {
  return await deployStrategy("avalanche", "IndexAvalancheGamingNFT")
}

async function upgradeIndexAvalancheDeFiStrategy() {
  return await upgradeStrategy("avalanche", "IndexAvalancheDeFi")
}

function testIndexAvalancheAddSwapRoute() {
  describe("addSwapRoute - IndexAvalancheDeFi Strategy Specific", async function () {
    it("should succeed after adding pangolin swap route of USDC-wAVAX", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.BigNumber.from("1"),
          "0x0e0100Ab771E9288e0Aa97e11557E6654C3a9665" // Pangolin wAVAX-USDC pair
        )
      ).not.to.be.reverted

      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("500", 6)
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("500.123", 6)
      )

      let indexTokenBalance: BigNumber

      // User 1 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user1.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 2 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user2.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 0 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })
  })
}

function testIndexAvalancheRemoveSwapRoute() {
  describe("removeSwapRoute - IndexAvalancheDeFi Strategy Specific", async function () {
    it("should succeed after replacing pangolin swap route of BENQI-wAVAX", async function () {
      // Note: This only works when the strategy has a BENQI-wAVAX route on TraderJoe.
      // This test can be removed after we replace the BENQI-wAVAX route on TraderJoe with someting else.

      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5", // BENQI
          "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", // Pangolin Router
          ethers.BigNumber.from("1"),
          "0xE530dC2095Ef5653205CF5ea79F8979a7028065c" // Pangolin wAVAX-BENQI pair
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner).removeSwapRoute(
          "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5", // BENQI
          "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3" // TraderJoe V2 Router
        )
      ).not.to.be.reverted

      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("1000", 6)
      )

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("500", 6)
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("500.123", 6)
      )

      let indexTokenBalance: BigNumber

      // User 1 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user1.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 2 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user2.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )

      // User 0 withdraws.
      indexTokenBalance = await this.indexToken.balanceOf(this.user0.address)
      await burn(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        indexTokenBalance,
        BigNumber.from(1)
      )
    })
  })
}
