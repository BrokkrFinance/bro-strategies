import * as fs from "fs"
import * as Tokens from "../../../../../constants/arbitrum/addresses/Tokens.json"

export function prodDeploymentConfig(chain: string, deployment_config_name: string) {
  const deploymentConfigPath = `${__dirname}/../../../../../configs/dca/${chain}/strategy/CoinBluechip/${deployment_config_name}`
  const config = JSON.parse(fs.readFileSync(deploymentConfigPath, "utf-8"))
  const testConfig = {
    depositToken: {
      address: config.dcaBaseArgs.depositTokenInfo.token,
      digits: config.dcaBaseArgs.depositTokenInfo.decimals,
    },
    bluechipToken: {
      address: config.strategyArgs[0].token,
      digits: config.strategyArgs[0].decimals,
    },
    swap: {
      swapProviderId: config.dcaBaseArgs.router.dex,
      swapProviderAddress: config.dcaBaseArgs.router.router,
      depositToBluechipPath: config.dcaBaseArgs.depositToBluechipSwapPath,
      bluechipToDepositPath: config.dcaBaseArgs.bluechipToDepositSwapPath,
      depositToBluechipBins: config.dcaBaseArgs.depositToBluechipSwapBins,
      bluechipToDepositBins: config.dcaBaseArgs.bluechipToDepositSwapBins,
    },
    emergency: {
      depositExitPath: [Tokens.usdc, Tokens.usdt],
      bluechipExitPath: [Tokens.wBtc, Tokens.wEth],
      depositExitBins: [1],
      bluechipExitBins: [10],
      depositExitTokenDigits: 6,
      bluechipExitTokenDigits: 18,
    },
    skipEmergencyExitTests: true,
  }

  return testConfig
}
