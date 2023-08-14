import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Arbitrum } from "../../../constants/networks/Arbitrum"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { upgradeStrategy } from "../../../scripts/contracts/forking/upgrade"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"
import { burn, mint } from "../helper/InvestHelper"
import { defaultAffiliatorAddress } from "../../helper/constants"

const indexArbitrumDeployTestOptions: IndexTestOptions = {
  network: Arbitrum(),
  forkAt: 108300000,
  upgradeTo: "OwnableV2",
}
const indexArbitrumUpgradeAfterDeployTestOptions: IndexTestOptions = {
  network: Arbitrum(),
  forkAt: 108300000,
  upgradeTo: "OwnableV2",
  runRebalance: false,
}

testStrategy("IndexArbitrumDeFi Strategy - Deploy", deployIndexArbitrumDeFiStrategy, indexArbitrumDeployTestOptions, [
  testIndexArbitrumEquityValuation,
  testIndexArbitrumSetSwapRoute,
])
testStrategy(
  "IndexArbitrumMarketCap Strategy - Deploy",
  deployIndexArbitrumMarketCapStrategy,
  indexArbitrumDeployTestOptions,
  [testIndexArbitrumEquityValuation, testIndexArbitrumSetSwapRoute]
)
testStrategy(
  "IndexArbitrumDeFi Strategy - Upgrade After Deploy",
  upgradeIndexArbitrumDeFiStrategy,
  indexArbitrumUpgradeAfterDeployTestOptions,
  [testIndexArbitrumEquityValuation, testIndexArbitrumSetSwapRoute]
)
testStrategy(
  "IndexArbitrumMarketCap Strategy - Upgrade After Deploy",
  upgradeIndexArbitrumMarketCapStrategy,
  indexArbitrumUpgradeAfterDeployTestOptions,
  [testIndexArbitrumEquityValuation, testIndexArbitrumSetSwapRoute]
)

async function deployIndexArbitrumDeFiStrategy() {
  return await deployStrategy("arbitrum", "IndexArbitrumDeFi")
}

async function deployIndexArbitrumMarketCapStrategy() {
  return await deployStrategy("arbitrum", "IndexArbitrumMarketCap")
}

async function upgradeIndexArbitrumDeFiStrategy() {
  return await upgradeStrategy("arbitrum", "IndexArbitrumDeFi")
}

async function upgradeIndexArbitrumMarketCapStrategy() {
  return await upgradeStrategy("arbitrum", "IndexArbitrumMarketCap")
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
        ethers.utils.parseUnits("10", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      // User 1 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user1,
        this.user1,
        this.depositToken,
        ethers.utils.parseUnits("5", this.depositTokenDecimals),
        defaultAffiliatorAddress
      )

      // User 2 deposits.
      await mint(
        this.strategy,
        this.indexToken,
        this.user2,
        this.user2,
        this.depositToken,
        ethers.utils.parseUnits("5.123", this.depositTokenDecimals),
        defaultAffiliatorAddress
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

    it("should succeed to replace swap route with bin step", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,uint8,address,uint256)"](
          "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
          "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30", // TraderJoe V2.1 Router
          ethers.BigNumber.from("5"),
          "0x94d53BE52706a155d27440C4a2434BEa772a6f7C", // USDC-wETH pair
          ethers.BigNumber.from("15") // Bin step
        )
      ).not.to.be.reverted

      await expect(
        this.strategy.connect(this.owner).removeSwapRoute(
          "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
          "0x7BFd7192E76D950832c77BB412aaE841049D8D9B" // TraderJoe V2 Router
        )
      ).not.to.be.reverted
    })
  })
}
