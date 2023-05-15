import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Arbitrum } from "../../../constants/networks/Arbitrum"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"
import { burn, mint } from "../helper/InvestHelper"

const indexAvalancheTestOptions: IndexTestOptions = {
  network: Arbitrum(),
  forkAt: 81364578,
}

testStrategy("IndexArbitrumDeFi Strategy - Deploy", deployIndexArbitrumDeFiStrategy, indexAvalancheTestOptions, [
  // testIndexArbitrumDeFiSetSwapRoute,
])

async function deployIndexArbitrumDeFiStrategy() {
  return await deployStrategy("arbitrum", "IndexArbitrumDeFi")
}

function testIndexArbitrumDeFiSetSwapRoute() {
  describe("SetSwapRoute - IndexArbitrumDeFi Strategy Specific", async function () {
    it("should succeed after adding pangolin swap route of USDC-wAVAX", async function () {
      await expect(
        this.strategy.connect(this.owner)["addSwapRoute(address,address,address,uint8,address)"](
          "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // wAVAX
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
