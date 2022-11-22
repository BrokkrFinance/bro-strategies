import { Contract } from "ethers"
import { deployProxyContract, getUsdcContract, logBlue, retryUntilSuccess } from "./helper"

import portfolioConfig from "../configs/dca/portfolio/PercAllocation.json"
import wBtcConfig from "../configs/dca/strategy/BTCBMain.json"

let usdc: Contract

async function deployWBTCDcaStrategy(): Promise<Contract> {
  return await deployProxyContract("WBTCBluechip", [
    wBtcConfig.dcaBaseArgs,
    wBtcConfig.bluechipTokenInfo,
    wBtcConfig.platypusInfo,
    wBtcConfig.ptpIntoBluechipSwapPath,
    wBtcConfig.avaxIntoBluechipSwapPath,
  ])
}

async function deployDcaPortfolio(): Promise<Contract> {
  return await deployProxyContract("PercentageAllocationPortfolio", [portfolioConfig.initArgs])
}

async function main() {
  usdc = await getUsdcContract()

  let dcaWBTC = await retryUntilSuccess(deployWBTCDcaStrategy())
  portfolioConfig.initArgs.investables = [dcaWBTC.address] as never[]

  let dcaPortfolio = await retryUntilSuccess(deployDcaPortfolio())

  await retryUntilSuccess(dcaWBTC.addPortfolio(dcaPortfolio.address))

  await retryUntilSuccess(dcaWBTC.transferOwnership(wBtcConfig.owner))
  await retryUntilSuccess(dcaPortfolio.transferOwnership(portfolioConfig.owner))

  logBlue(`WBTC DCA Deplyed at: ${dcaWBTC.address}`)
  logBlue(`DCA Portfolio Deployed at ${dcaPortfolio.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
