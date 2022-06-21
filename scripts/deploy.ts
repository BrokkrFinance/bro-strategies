import { deployContract } from "./helper"

async function main() {
  deployContract("GmxDn", [])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
