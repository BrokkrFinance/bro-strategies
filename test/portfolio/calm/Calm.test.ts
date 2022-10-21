import { upgradePortfolio } from "../../helper/contracts"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio - Upgrade After Deploy", upgradeCalmPortfolio, [])

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("portfolio/Calm.json")
}
