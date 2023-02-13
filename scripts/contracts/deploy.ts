import { execSync } from "child_process"
import { deploy } from "./execution/deploy"

async function main() {
  execSync("yarn hardhat clean && yarn compile", { stdio: "inherit" })

  const args = process.argv.slice(2)

  if (args.length != 3) {
    console.log("Deploy: Wrong arguments. The arguments must be network, type and name.")
    console.log("Deploy: ts-node ./scripts/contracts/deploy.ts avalanche portfolio Calm")
    throw new Error("Wrong arguments")
  }

  const network = args[0]
  const type = args[1]
  const name = args[2]

  await deploy({
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
