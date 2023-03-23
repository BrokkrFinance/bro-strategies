import { ethers } from "hardhat"
import { deployUUPSUpgradeableContract } from "../../../../scripts/contracts/core/deploy"
import { getTokenContract } from "../../../../scripts/helper/helper"
import { currentBlockchainTime, testDcaStrategy } from "../Strategy.test"
import { depositEthHoldBtcConfig } from "./config/depositEthHoldBtcConfig"
import { depositUsdcHoldBtcConfig } from "./config/depositUsdcHoldBtcConfig"
import { depositUsdcHoldEthConfig } from "./config/depositUsdcHoldEthConfig"

getTokenContract
depositUsdcHoldEthConfig
depositUsdcHoldBtcConfig
depositEthHoldBtcConfig

testDcaStrategy("CoinBluechip usdc -> btc DCA Strategy", deployCoinBluechipDcaStrategy, [], depositUsdcHoldBtcConfig())
testDcaStrategy("CoinBluechip usdc -> eth DCA Strategy", deployCoinBluechipDcaStrategy, [], depositUsdcHoldEthConfig())
// uncomment after the test script has been changed to properly handle decimals
// testDcaStrategy("CoinBluechip eth -> btc DCA Strategy", deployCoinBluechipDcaStrategy, [], depositEthHoldBtcConfig())

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
