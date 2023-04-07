export async function verifyContract(address: string): Promise<void> {
  const { run } = require("hardhat")

  console.log(`Verify: Verify a contract at ${address}`)

  try {
    await run("verify", { address })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Contract source code already verified") {
      console.log("Verify: The contract is already verified.")
    } else {
      console.log(`Verify: The following error occured during verificaiton.\n\n${e}`)
    }
  }
}
