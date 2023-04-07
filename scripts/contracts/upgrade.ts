import { execSync } from "child_process"
import { upgrade } from "./execution/upgrade"

async function main() {
  execSync("yarn hardhat clean && yarn compile", { stdio: "inherit" })

  const args = process.argv.slice(2)

  if (args.length != 3) {
    console.log("Upgrade: Wrong arguments. The arguments must be network, type and name.")
    console.log("Upgrade: ts-node ./scripts/contracts/upgrade.ts avalanche portfolio Calm")
    throw new Error("Wrong arguments")
  }

  const network = args[0]
  const type = args[1]
  const name = args[2]

  await upgrade({
    network,
    type,
    name,
  })
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
