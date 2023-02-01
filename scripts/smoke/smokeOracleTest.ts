import { config } from "chai"
import { ethers, upgrades } from "hardhat"
import {
  ContractAddrs,
  contractAt,
  deployFreeMoneyProvider,
  deployPortfolio,
  deployProxyContract,
  expectSuccess,
  getUsdcContract,
  logBlue,
  logCyan,
  logRed,
} from "../helper/helper"

import { deployStrategy } from "../helper/contract"

config.includeStack = true

ContractAddrs
deployFreeMoneyProvider
deployPortfolio
deployStrategy
logBlue
logCyan
logRed
contractAt
deployProxyContract
expectSuccess
getUsdcContract

describe("Price oracle", function () {
  this.timeout(60 * 60 * 1000)

  it("Smoke test", async function () {
    const accounts = await ethers.getSigners()

    // If your contract requires constructor args, you can specify them here
    const oracle = await upgrades.deployProxy(await ethers.getContractFactory("VenusOracle"), [
      "0x516c18DC440f107f12619a6d2cc320622807d0eE",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    ])
    console.log(oracle.address)
    await oracle.setTokenToVToken(
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      "0x95c78222B3D6e262426483D42CfA53685A67Ab9D"
    )
    await oracle.setTokenToVToken(
      "0x0000000000000000000000000000000000000002",
      "0xa07c5b74c9b40447a954e1466938b865b6bbea36"
    )

    // get price
    console.log((await oracle.getPrice("0x0000000000000000000000000000000000000002", false, false)).toString())
  })
})
