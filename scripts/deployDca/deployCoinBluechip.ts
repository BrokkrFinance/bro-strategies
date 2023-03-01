import { Contract } from "ethers"
import { readFileSync } from "fs"
import { deployProxyContract, logBlue, retryUntilSuccess } from "../helper/helper"

async function deployStrategy(strategyConfig: any): Promise<Contract> {
  return await deployProxyContract("CoinBluechip", [strategyConfig.dcaBaseArgs, ...strategyConfig.strategyArgs], {})
}

async function main() {
  let configFilePath
  if (typeof process.env.DEPLOYMENT_CONFIG === "undefined") {
    console.error("DEPLOYMENT_CONFIG=<full path to deployment script> environment variable needs to be set")
    process.exit(-1)
  } else {
    configFilePath = process.env.DEPLOYMENT_CONFIG
  }

  // deploying strategy
  let strategyConfig = JSON.parse(readFileSync(configFilePath, "utf-8"))
  let strategy = await retryUntilSuccess(deployStrategy(strategyConfig))

  // changing ownership
  await retryUntilSuccess(strategy.transferOwnership(strategyConfig.owner))
  logBlue(`Ownersip trasferred to: ${strategyConfig.owner}`)

  // test deposit
  // const minDepositAmount = strategyConfig.dcaBaseArgs.minDepositAmount
  // const depositTokenAddr = strategyConfig.dcaBaseArgs.depositTokenInfo.token
  // const depositTokenContract = await retryUntilSuccess(getTokenContract(depositTokenAddr))
  // const usdcWhale = await retryUntilSuccess(ethers.getImpersonatedSigner(WhaleAddrs[depositTokenAddr]))
  // await retryUntilSuccess(setBalance(usdcWhale.address, ethers.utils.parseEther("10000")))
  // await retryUntilSuccess(depositTokenContract.connect(usdcWhale).approve(strategy.address, minDepositAmount))
  // await retryUntilSuccess(strategy.connect(usdcWhale).deposit(minDepositAmount, 52))

  logBlue(`Strategy deployed at: ${strategy.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
