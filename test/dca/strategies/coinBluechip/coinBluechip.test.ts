import { ethers } from "hardhat"
import { deployUUPSUpgradeableContract } from "../../../../scripts/contracts/core/deploy"
import { getTokenContract } from "../../../../scripts/helper/helper"
import { Arbitrum } from "../../chains/Arbitrum"
import { Avalanche } from "../../chains/Avalanche"
import { currentBlockchainTime, testDcaStrategy } from "../Strategy.test"
import { depositEthHoldBtcConfigAvalanche } from "./config/depositEthHoldBtcConfigAvalanche"
import { depositUsdcHoldBtcConfigArbitrum } from "./config/depositUsdcHoldBtcConfigArbitrum"
import { depositUsdcHoldBtcConfigAvalanche } from "./config/depositUsdcHoldBtcConfigAvalanche"
import { depositUsdcHoldEthConfigAvalanche } from "./config/depositUsdcHoldEthConfigAvalanche"
import { prodDeploymentConfig } from "./config/prodDeploymentConfig"

getTokenContract
depositUsdcHoldEthConfigAvalanche
depositUsdcHoldBtcConfigAvalanche
depositEthHoldBtcConfigAvalanche
depositUsdcHoldBtcConfigArbitrum
Avalanche
Arbitrum

// prod deployments
testDcaStrategy(
  "CoinBluechip usdc -> arb DCA Strategy on Arbitrum (Production contract)",
  deployCoinBluechipDcaStrategy,
  [],
  prodDeploymentConfig("arbitrum", "usdc_arb_prod.json"),
  Arbitrum()
)
testDcaStrategy(
  "CoinBluechip usdc -> eth DCA Strategy on Arbitrum (Production contract)",
  deployCoinBluechipDcaStrategy,
  [],
  prodDeploymentConfig("arbitrum", "usdc_eth_prod.json"),
  Arbitrum()
)
testDcaStrategy(
  "CoinBluechip usdc -> magic DCA Strategy on Arbitrum (Production contract)",
  deployCoinBluechipDcaStrategy,
  [],
  prodDeploymentConfig("arbitrum", "usdc_magic_prod.json"),
  Arbitrum()
)
testDcaStrategy(
  "CoinBluechip usdc -> rdnt DCA Strategy on Arbitrum (Production contract)",
  deployCoinBluechipDcaStrategy,
  [],
  prodDeploymentConfig("arbitrum", "usdc_rdnt_prod.json"),
  Arbitrum()
)
testDcaStrategy(
  "CoinBluechip usdc -> dpx DCA Strategy on Arbitrum (Production contract)",
  deployCoinBluechipDcaStrategy,
  [],
  prodDeploymentConfig("arbitrum", "usdc_dpx_prod.json"),
  Arbitrum()
)

// test deployments
testDcaStrategy(
  "CoinBluechip usdc -> btc DCA Strategy on Arbitrum",
  deployCoinBluechipDcaStrategy,
  [],
  depositUsdcHoldBtcConfigArbitrum(),
  Arbitrum()
)
testDcaStrategy(
  "CoinBluechip usdc -> btc DCA Strategy on Avalanche",
  deployCoinBluechipDcaStrategy,
  [],
  depositUsdcHoldBtcConfigAvalanche(),
  Avalanche()
)
// testDcaStrategy(
//   "CoinBluechip usdc -> eth DCA Strategy on Avalanche",
//   deployCoinBluechipDcaStrategy,
//   [],
//   depositUsdcHoldEthConfigAvalanche(),
//   Avalanche()
// )

// uncomment after the test script has been changed to properly handle decimals
// testDcaStrategy("CoinBluechip eth -> btc DCA Strategy", deployCoinBluechipDcaStrategyAvalanche, [], depositEthHoldBtcConfig())

async function deployCoinBluechipDcaStrategy(testConfig: any) {
  const signers = await ethers.getSigners()

  return await deployUUPSUpgradeableContract(await ethers.getContractFactory("CoinBluechip"), [
    [
      [signers[1].address, 1000],
      signers[2].address,
      [testConfig.depositToken.address, testConfig.depositToken.digits],
      86400,
      (await currentBlockchainTime(ethers.provider)) + 86400,
      1000000,
      52,
      [testConfig.swap.swapProviderId, testConfig.swap.swapProviderAddress],
      testConfig.swap.depositToBluechipPath,
      testConfig.swap.bluechipToDepositPath,
      testConfig.swap.depositToBluechipBins,
      testConfig.swap.bluechipToDepositBins,
    ],
    [testConfig.bluechipToken.address, testConfig.bluechipToken.digits],
  ])
}
