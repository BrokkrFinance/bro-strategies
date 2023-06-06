import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Arbitrum } from "../../../constants/networks/Arbitrum"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"
import { burn, mint } from "../helper/InvestHelper"

const indexArbitrumTestOptions: IndexTestOptions = {
  network: Arbitrum(),
  forkAt: 98594600,
  upgradeTo: "OwnableV2",
}

testStrategy("IndexArbitrumDeFi Strategy - Deploy", deployIndexArbitrumDeFiStrategy, indexArbitrumTestOptions, [
  testIndexArbitrumEquityValuation,
  // testIndexArbitrumDeFiSetSwapRoute,
])
testStrategy(
  "IndexArbitrumMarketCap Strategy - Deploy",
  deployIndexArbitrumMarketCapStrategy,
  indexArbitrumTestOptions,
  [testIndexArbitrumEquityValuation] // testIndexArbitrumSetSwapRoute]
)

async function deployIndexArbitrumDeFiStrategy() {
  return await deployStrategy("arbitrum", "IndexArbitrumDeFi")
}

async function deployIndexArbitrumMarketCapStrategy() {
  return await deployStrategy("arbitrum", "IndexArbitrumMarketCap")
}

function testIndexArbitrumEquityValuation() {
  describe("EquityValuation - IndexArbitrum Strategy Specific", async function () {
    it("should succeed to call equityValuation", async function () {
      await expect(this.strategy.equityValuation(true, true)).not.to.be.reverted
    })
  })
}

function testIndexArbitrumSetSwapRoute() {
  describe("SetSwapRoute - IndexArbitrumDeFi Strategy Specific", async function () {
    afterEach(async function () {
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

    it("should succeed to add swap route without any data", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address)"](
          "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
          "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // Sushi Router
          ethers.BigNumber.from("1"),
          "0x905dfCD5649217c42684f23958568e533C711Aa3" // USDC-wETH pair
        )
      ).not.to.be.reverted
    })

    it("should succeed to add swap route with bin step", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address,uint256)"](
          "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
          "0x7BFd7192E76D950832c77BB412aaE841049D8D9B", // TraderJoe V2 Router
          ethers.BigNumber.from("2"),
          "0x7eC3717f70894F6d9BA0be00774610394Ce006eE", // USDC-wETH pair
          ethers.BigNumber.from("15") // Bin step
        )
      ).not.to.be.reverted
    })

    it("should succeed to add swap route with factory", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address,address)"](
          "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
          "0xE708aA9E887980750C040a6A2Cb901c37Aa34f3b", // Chronos router
          ethers.BigNumber.from("4"),
          "0xA2F1C1B52E1b7223825552343297Dc68a29ABecC", // USDC-wETH pair
          "0xCe9240869391928253Ed9cc9Bcb8cb98CB5B0722" // Factory
        )
      ).not.to.be.reverted
    })
  })
}
