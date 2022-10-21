import { upgradePortfolio } from "../../helper/contracts"
import { testPortfolio } from "../Portfolio.test"

testPortfolio("Calm Portfolio", upgradeCalmPortfolio, [])

async function upgradeCalmPortfolio() {
  return await upgradePortfolio("portfolio/Calm.json")
}
