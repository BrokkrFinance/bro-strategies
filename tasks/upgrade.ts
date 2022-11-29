import { AdminClient } from "defender-admin-client"
import { ProposalResponseWithUrl } from "defender-admin-client/lib/api"
import { task } from "hardhat/config"
import { verifyContract } from "../scripts/helper/contract"

task("upgrade", "Upgrade a proxy contract to point to a new implementation contract")
  .addParam("targetNetwork", "A network to deploy")
  .addParam("proxy", "An address of proxy contract to be upgraded")
  .addParam("newImplementation", "A name of new implementation contract")
  .addParam("multisig", "An address of multisig to propose an upgrade")
  .addOptionalParam("functionName", "A name of function to be called after upgrade")
  .addOptionalParam("functionArgs", "A arguments of function to be called after upgrade")
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Upgrade: Prepare upgrade proposal of proxy ${taskArgs.proxy} with new implementation ${taskArgs.newImplementation} to ${taskArgs.multisig}.`
    )

    // Store previous network.
    const previousNetwork = hre.network.name

    // Switch to target network.
    await hre.changeNetwork(taskArgs.targetNetwork)

    // Create upgrade proposal.
    let proposal: ProposalResponseWithUrl
    let newImplementationAddress: string | undefined

    const NewImplementation = await hre.ethers.getContractFactory(taskArgs.newImplementation)

    if (taskArgs.functionName !== undefined && taskArgs.functionArgs !== undefined) {
      // Upgrade and call.
      const defenderConfig = hre.config.defender

      if (defenderConfig === undefined) {
        throw new Error("Upgrade: Failed to find Defender config from HardhatRuntimeEnvironment.")
      }

      const defenderAdmin = new AdminClient(defenderConfig)

      const data = NewImplementation.interface.encodeFunctionData(
        taskArgs.functionName,
        parseArgs(taskArgs.functionArgs)
      )

      newImplementationAddress = (await hre.upgrades.prepareUpgrade(taskArgs.proxy, NewImplementation)) as string

      proposal = await defenderAdmin.createProposal({
        contract: { address: taskArgs.proxy, network: taskArgs.targetNetwork },
        title: `Upgrade to ${newImplementationAddress.slice(0, 10)} and call ${taskArgs.functionName}`,
        description: `Upgrade contract implementation to ${newImplementationAddress} and call ${taskArgs.functionName} with ${taskArgs.functionArgs}`,
        type: "custom",
        functionInterface: {
          name: "upgradeToAndCall",
          inputs: [
            { type: "address", name: "newImplementation" },
            { type: "bytes", name: "data" },
          ],
        },
        functionInputs: [newImplementationAddress, data],
        via: taskArgs.multisig,
        viaType: "Gnosis Safe",
      })
    } else {
      // Upgrade.
      proposal = await hre.defender.proposeUpgrade(taskArgs.proxy, NewImplementation, {
        multisig: taskArgs.multisig,
      })

      newImplementationAddress = proposal.metadata?.newImplementationAddress
    }

    // Verify new implementation contract.
    console.log("Upgrade: Verify new implementation contract.\n")

    if (newImplementationAddress === undefined) {
      console.log("Upgrade: Couldn't find new implementation contract's address. Skip verification.")
    } else {
      await verifyContract(newImplementationAddress)
      console.log()
    }

    console.log(`Upgrade: The upgrade proposal is created at ${proposal.url}`)

    // Switch back to the previous network.
    await hre.changeNetwork(previousNetwork)

    console.log()
  })

function parseArgs(stringfiedArgs: string): string[] | string[][] {
  if (stringfiedArgs === "[]") {
    return []
  }

  let extraArgs: string[] | string[][]

  if (stringfiedArgs.startsWith("[[") === true && stringfiedArgs.endsWith("]]") === true) {
    extraArgs = [stringfiedArgs.slice(2, -2).split(",")]
  } else {
    extraArgs = stringfiedArgs.slice(1, -1).split(",")
  }

  return extraArgs
}
