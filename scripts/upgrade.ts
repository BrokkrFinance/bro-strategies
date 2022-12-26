import { execSync } from "child_process"
import { readUpgradeConfig } from "./helper/files"
import { UpgradeConfig } from "./interfaces/configs"
import { Library } from "./interfaces/library"

async function main() {
  const { run } = require("hardhat")

  execSync("yarn hardhat clean && yarn compile", { stdio: "inherit" })

  const args = process.argv.slice(2)

  if (args.length != 3) {
    console.log("Upgrade: Wrong arguments. The arguments must be network, contract type/name and multisig address.")
    console.log(
      "Upgrade: ts-node ./scripts/upgrade.ts avalanche portfolio/Calm 0xE8855828fEC29dc6860A4362BCb386CCf6C0c601"
    )
    return
  }

  const network = args[0]
  const name = args[1]
  const multisig = args[2]

  const upgradeConfigs: UpgradeConfig[] = await readUpgradeConfig(name)

  for (let upgradeConfig of upgradeConfigs) {
    const upgradeArgs: { [key: string]: string } = {
      targetNetwork: network,
      proxy: upgradeConfig.proxy,
      newImplementation: upgradeConfig.newImplementation,
      multisig: multisig,
    }

    if (upgradeConfig.functionName !== undefined && upgradeConfig.functionArgs !== undefined) {
      upgradeArgs["functionName"] = upgradeConfig.functionName
      upgradeArgs["functionArgs"] = JSON.stringify(upgradeConfig.functionArgs).replace(/["]/g, "")
    }

    if (upgradeConfig.libraries !== undefined) {
      upgradeArgs["libraryNames"] = JSON.stringify(
        upgradeConfig.libraries.map((library: Library) => library.name)
      ).replace(/["]/g, "")
      upgradeArgs["libraryDependencies"] = JSON.stringify(
        upgradeConfig.libraries.map((library: Library) => library.dependencies)
      ).replace(/["]/g, "")
    }

    await run("upgrade", upgradeArgs)
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
