import { Avalanche } from "../../../constants/networks/Avalanche"
import { deployPortfolio } from "../../../scripts/contracts/forking/deploy"
import { PortfolioTestOptions } from "../../helper/interfaces/options"
import { testPortfolio } from "../Portfolio.test"

const mockTestOptions: PortfolioTestOptions = {
  network: Avalanche(),
  forkAt: 29197000,
  upgradeTo: "",
}

testPortfolio("MockPortfolio - Deploy", deployMockPortfolio, mockTestOptions, [])

async function deployMockPortfolio() {
  return await deployPortfolio("avalanche", "Mock")
}
