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

  if (args.length != 3) {
    console.log("Upgrade: Wrong arguments. The arguments must be network, config filename and multisig address.")
    console.log(
      "Upgrade: ts-node ./scripts/upgrade.ts avax_mainnet Calm.json 0xE8855828fEC29dc6860A4362BCb386CCf6C0c601"
    )
    return
  }

  const network = args[0]
  const config = args[1]
  const multisig = args[2]

  process.chdir(__dirname)
  const upgradeConfigs: UpgradeConfig[] = JSON.parse(
    readFileSync(path.join(PATH_CONFIG, config), { encoding: "utf-8" })
  )
  process.chdir("../")

  for (let upgradeConfig of upgradeConfigs) {
    execSync(
      `npx hardhat --network ${network} upgrade \
      --proxy ${upgradeConfig.proxy} \
      --new-implementation ${upgradeConfig.newImplementation} \
      --multisig ${multisig}`,
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
