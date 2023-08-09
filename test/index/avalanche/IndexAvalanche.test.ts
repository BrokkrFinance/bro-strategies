import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Avalanche } from "../../../constants/networks/Avalanche"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { upgradeStrategy } from "../../../scripts/contracts/forking/upgrade"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"
import { burn, mint } from "../helper/InvestHelper"

const indexAvalancheTestOptions: IndexTestOptions = {
  network: Avalanche(),
  forkAt: 33695425,
  upgradeTo: "OwnableV2",
}

testStrategy("IndexAvalancheDeFi Strategy - Deploy", deployIndexAvalancheDeFiStrategy, indexAvalancheTestOptions, [
  testIndexAvalancheEquityValuation,
  testIndexAvalancheSetSwapRoute,
])
testStrategy(
  "IndexAvalancheGamingNFT Strategy - Deploy",
  deployIndexAvalancheGamingNFTStrategy,
  indexAvalancheTestOptions,
  [testIndexAvalancheEquityValuation]
)
testStrategy(
  "AvalancheTopMarketCapIndex Strategy - Deploy",
  deployIndexAvalancheTopMarketCapStrategy,
  indexAvalancheTestOptions,
  [testIndexAvalancheEquityValuation]
)
testStrategy(
  "IndexAvalancheDeFi Strategy - Upgrade After Deploy",
  upgradeIndexAvalancheDeFiStrategy,
  indexAvalancheTestOptions,
  [testIndexAvalancheEquityValuation, testIndexAvalancheSetSwapRoute]
)
testStrategy(
  "IndexAvalancheGamingNFT Strategy - Upgrade After Deploy",
  upgradeIndexAvalancheGamingNFTStrategy,
  indexAvalancheTestOptions,
  [testIndexAvalancheEquityValuation]
)

async function deployIndexAvalancheDeFiStrategy() {
  return await deployStrategy("avalanche", "IndexAvalancheDeFi")
}

async function deployIndexAvalancheGamingNFTStrategy() {
  return await deployStrategy("avalanche", "IndexAvalancheGamingNFT")
}

async function upgradeIndexAvalancheDeFiStrategy() {
  return await upgradeStrategy("avalanche", "IndexAvalancheDeFi")
}

async function upgradeIndexAvalancheGamingNFTStrategy() {
  return await upgradeStrategy("avalanche", "IndexAvalancheGamingNFT")
}

async function deployIndexAvalancheTopMarketCapStrategy() {
  return await deployStrategy("avalanche", "AvalancheTopMarketCapIndex")
}

function testIndexAvalancheEquityValuation() {
  describe("EquityValuation - IndexAvalanche Strategy Specific", async function () {
    it("should succeed to call equityValuation", async function () {
      await expect(this.strategy.equityValuation(true, true)).not.to.be.reverted
    })
  })
}

function testIndexAvalancheSetSwapRoute() {
  describe("SetSwapRoute - IndexAvalanche Strategy Specific", async function () {
    afterEach(async function () {
      // User 0 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user0,
        this.user0,
        this.depositToken,
        ethers.utils.parseUnits("10", this.depositTokenDecimals)
      )

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("5", this.depositTokenDecimals)
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5.123", this.depositTokenDecimals)
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

    it("should succeed to replace swap routes with bin step", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address,uint256)"](
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30", // TraderJoe V2.1 Router
          ethers.BigNumber.from("5"),
          "0xD446eb1660F766d533BeCeEf890Df7A69d26f7d1", // wAVAX-USDC pair
          ethers.BigNumber.from("20")
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address,uint256)"](
          "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // JOE
          "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30", // TraderJoe V2.1 Router
          ethers.BigNumber.from("5"),
          "0x9f8973FB86b35C307324eC31fd81Cf565E2F4a63", // wAVAX-JOE pair
          ethers.BigNumber.from("15")
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner).removeSwapRoute(
          "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
          "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3" // TraderJoe V2 Router
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner).removeSwapRoute(
          "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", // JOE
          "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3" // TraderJoe V2 Router
        )
      ).not.to.be.reverted
    })
  })
}
