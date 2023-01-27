import Avalanche from "../../../constants/networks/Avalanche.json"
import { deployPortfolio, upgradePortfolio } from "../../../scripts/helper/contract"
import { PortfolioTestOptions } from "../../helper/interfaces/options"
import { testPortfolio } from "../Portfolio.test"

const calmTestOptions: PortfolioTestOptions = {
  network: Avalanche,
  upgradeTo: "PercentageAllocationV2",
}

testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, calmTestOptions, [])
testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, calmTestOptions, [])

async function deployCalmPortfolio() {
  return await deployPortfolio("Calm")
}

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("Calm")
}
