import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers"
import { readFileSync } from "fs"
import { ethers, upgrades } from "hardhat"
import path from "path"
import { UpgradeConfig } from "../../../scripts/upgrade"
import investableAbi from "../../helper/abi/investable.json"
import { testPortfolio } from "../Portfolio.test"

const CONFIG_PATH = "../../../configs/upgrade"
const CONFIG_FILE = "portfolio/Calm.json"

testPortfolio("Calm Portfolio", upgradeCalmPortfolio, [])

async function upgradeCalmPortfolio() {
  const portfolio = await ethers.getContractAt("PercentageAllocation", "0x2eAf73F8E6BCf606f56E5cf201756C1f0565C068")
  const multisig = await ethers.getImpersonatedSigner("0xE8855828fEC29dc6860A4362BCb386CCf6C0c601")

  process.chdir(__dirname)
  const upgradeConfigs: UpgradeConfig[] = JSON.parse(
    readFileSync(path.join(CONFIG_PATH, CONFIG_FILE), { encoding: "utf-8" })
  )
  process.chdir("../../../")

  for (let upgradeConfig of upgradeConfigs) {
    const NewImplementation = await ethers.getContractFactory(upgradeConfig.newImplementation, multisig)
    const newImplementation = await upgrades.upgradeProxy(upgradeConfig.proxy, NewImplementation, { kind: "uups" })
    await newImplementation.deployed()
  }

  // Set investment limits of portfolio and all its investables to big enough value to prevent any test being affected by the limits.
  setInvestmentLimits(portfolio, multisig, BigInt(1e20))

  return portfolio
}

async function setInvestmentLimits(portfolio: Contract, owner: SignerWithAddress, limit: BigInt) {
  await portfolio.connect(owner).setTotalInvestmentLimit(limit)
  await portfolio.connect(owner).setInvestmentLimitPerAddress(limit)

  const investables = await portfolio.getInvestables()
  for (let i = 0; i < investables.length; i++) {
    const investable = await ethers.getContractAt(investableAbi, await investables[i].investable)
    await investable.connect(owner).setTotalInvestmentLimit(limit)
    await investable.connect(owner).setInvestmentLimitPerAddress(limit)
  }
}
