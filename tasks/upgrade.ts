import { task } from "hardhat/config"

task("upgrade", "Upgrade a proxy contract to point to a new implementation contract")
  .addParam("proxy", "An address of proxy contract to be upgraded")
  .addParam("newImplementation", "The name of new implementation contract")
  .addParam("multisig", "An address of multisig to propose an upgrade")
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Prepare upgrade proposal of proxy ${taskArgs.proxy} with new implementation ${taskArgs.newImplementation} to ${taskArgs.multisig}`
    )

    const NewImplementation = await hre.ethers.getContractFactory(taskArgs.newImplementation)
    const proposal = await hre.defender.proposeUpgrade(taskArgs.proxy, NewImplementation, {
      multisig: taskArgs.multisig,
      unsafeSkipStorageCheck: true,
    })

    console.log(`The upgrade proposal is created at ${proposal.url}\n`)

    console.log("Verify new implementation contract if it is unverified")

    const newImplementationAddress = proposal.metadata?.newImplementationAddress
    if (newImplementationAddress !== undefined) {
      try {
        await hre.run("verify", { address: newImplementationAddress })
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "Contract source code already verified") {
          console.log("New implementation contract is already verified.")
        } else {
          console.log(`An error occured during verificaiton: ${e}`)
        }
      }
    } else {
      console.log("Couldn't find new implementation contract's address. Skip verification.")
    }

    console.log()
  })
