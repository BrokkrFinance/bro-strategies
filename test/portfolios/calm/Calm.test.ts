import Avalanche from "../../../constants/networks/Avalanche.json"
import { deployPortfolio } from "../../../scripts/contracts/forking/deploy"
import { upgradePortfolio } from "../../../scripts/contracts/forking/upgrade"
import { PortfolioTestOptions } from "../../helper/interfaces/options"
import { testPortfolio } from "../Portfolio.test"

const calmTestOptions: PortfolioTestOptions = {
  network: Avalanche,
  forkAt: 29197000,
  upgradeTo: "PercentageAllocationV2",
}

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, calmTestOptions, [])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, calmTestOptions, [])

async function deployCalmPortfolio() {
  return await deployPortfolio("avalanche", "Calm")
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("avalanche", "Calm")
}
