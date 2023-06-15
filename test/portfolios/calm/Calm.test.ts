import { Avalanche } from "../../../constants/networks/Avalanche"
import { deployPortfolio } from "../../../scripts/contracts/forking/deploy"
import { PortfolioTestOptions } from "../../helper/interfaces/options"
import { testPortfolio } from "../Portfolio.test"

const calmTestOptions: PortfolioTestOptions = {
  network: Avalanche(),
  forkAt: 29197000,
  upgradeTo: "",
}

// testPortfolio("Calm Portfolio - Deploy", deployCalmPortfolio, calmTestOptions, [])

// Disabled the upgrade test, as the new portfolio storage layout has changed.
// In the very unlikely case that we have to upgrade the calm portfolio, the original portfolio code can be brought back.
// testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, calmTestOptions, [])

async function deployCalmPortfolio() {
  return await deployPortfolio("avalanche", "Calm")
}

// async function upgradeCalmPortfolio() {
//   return await upgradePortfolio("avalanche", "Calm")
// }
