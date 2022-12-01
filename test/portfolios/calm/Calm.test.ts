import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { deployPortfolio, upgradePortfolio } from "../../../scripts/helper/contract"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, "PercentageAllocationV2", [])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, "PercentageAllocationV2", [])

async function deployCalmPortfolio() {
  return await deployPortfolio("Calm")
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("Calm")
}
