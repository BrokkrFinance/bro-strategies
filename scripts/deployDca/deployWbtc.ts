import { Contract } from "ethers"
import portfolioConfig from "../../configs/dca/portfolio/PercAllocation.json"
import wBtcConfig from "../../configs/dca/strategy/BTCBMain.json"
import { deployProxyContract, logBlue, retryUntilSuccess } from "../helper/helper"

async function deployWBTCDcaStrategy(): Promise<Contract> {
  return await deployProxyContract(
    "WBTCBluechip",
    [
      wBtcConfig.dcaBaseArgs,
      wBtcConfig.bluechipTokenInfo,
      wBtcConfig.platypusInfo,
      wBtcConfig.ptpIntoBluechipSwapPath,
      wBtcConfig.avaxIntoBluechipSwapPath,
    ],
    {}
  )
}

async function deployDcaPortfolio(): Promise<Contract> {
  return await deployProxyContract("PercentageAllocationPortfolio", [portfolioConfig.initArgs], {})
}

async function main() {
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
