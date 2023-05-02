import { ethers } from "hardhat"
import { deployUUPSUpgradeableContract } from "../../../../scripts/helper/contract"
import { getTokenContract } from "../../../../scripts/helper/helper"
import { currentBlockchainTime } from "../Strategy.test"
import { depositUsdcFarmBtcConfig } from "./config/depositUsdcFarmBtcConfig"

getTokenContract
depositUsdcFarmBtcConfig

// todo: uncomment after the contract size is shrinked
//testDcaStrategy("WbtcFarm - usdc -> farm btc DCA Strategy", deployWbtcDcaStrategy, [], depositUsdcFarmBtcConfig())

async function deployWbtcDcaStrategy(testConfig: any) {
  const signers = await ethers.getSigners()

  return await deployUUPSUpgradeableContract(await ethers.getContractFactory("WBTCBluechip"), [
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
