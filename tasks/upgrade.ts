import { task } from "hardhat/config"
import { verifyContract } from "../scripts/helper/contract"

task("upgrade", "Upgrade a proxy contract to point to a new implementation contract")
  .addParam("targetNetwork", "A network to deploy")
  .addParam("proxy", "An address of proxy contract to be upgraded")
  .addParam("newImplementation", "A name of new implementation contract")
  .addParam("multisig", "An address of multisig to propose an upgrade")
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Upgrade: Prepare upgrade proposal of proxy ${taskArgs.proxy} with new implementation ${taskArgs.newImplementation} to ${taskArgs.multisig}.`
    )

    // Store previous network.
    const previousNetwork = hre.network.name

    // Switch to target network.
    await hre.changeNetwork(taskArgs.targetNetwork)

    const NewImplementation = await hre.ethers.getContractFactory(taskArgs.newImplementation)
    const proposal = await hre.defender.proposeUpgrade(taskArgs.proxy, NewImplementation, {
      multisig: taskArgs.multisig,
      // unsafeSkipStorageCheck: true,
    })

    console.log(`Upgrade: The upgrade proposal is created at ${proposal.url}`)

    console.log("Upgrade: Verify new implementation contract.\n")

    const newImplementationAddress = proposal.metadata?.newImplementationAddress

    if (newImplementationAddress === undefined) {
      console.log("Upgrade: Couldn't find new implementation contract's address. Skip verification.")
      throw new Error("Wrong arguments")
    }

    await verifyContract(newImplementationAddress)

    // Switch back to the previous network.
    await hre.changeNetwork(previousNetwork)

    console.log()
  })
