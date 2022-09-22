import { execSync } from "child_process"
import { readFileSync } from "fs"
import path from "path"

const PATH_CONFIG = "../configs/upgrade"

interface UpgradeConfig {
  proxy: string
  newImplementation: string
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length != 2) {
    console.log("Upgrade: Wrong arguments. The arguments must be network and config filename.")
    console.log("Upgrade: ts-node ./scripts/upgrade.ts avax_mainnet Calm.json")
    return
  }

  const network = args[0]
  const config = args[1]

  process.chdir(__dirname)
  const upgradeConfigs: UpgradeConfig[] = JSON.parse(
    readFileSync(path.join(PATH_CONFIG, config), { encoding: "utf-8" })
  )
  process.chdir("../")

  for (let upgradeConfig of upgradeConfigs) {
    execSync(
      `npx hardhat --network ${network} upgrade \
      --proxy ${upgradeConfig.proxy} \
      --new-implementation ${upgradeConfig.newImplementation}`,
      {
        stdio: "inherit",
      }
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
