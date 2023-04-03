import Avalanche from "../../../constants/networks/Avalanche.json"
import { deployStrategy } from "../../../scripts/contracts/forking/deploy"
import { IndexTestOptions } from "../../helper/interfaces/options"
import { testStrategy } from "../Strategy.test"

const indexAvalancheTestOptions: IndexTestOptions = {
  network: Avalanche,
}

testStrategy("IndexAvalancheDeFi Strategy - Deploy", deployIndexAvalancheDeFiStrategy, indexAvalancheTestOptions, [])

async function deployIndexAvalancheDeFiStrategy() {
  return await deployStrategy("avalanche", "IndexAvalancheDeFi")
}
