import { task } from "hardhat/config"

task("upgrade", "Upgrade a proxy contract to point to a new implementation contract")
  .addParam("proxy", "an address of proxy contract to be upgraded")
  .addParam("newImplementation", "the name of new implementation contract")
  .addParam("multisig", "an address of multisig to propose an upgrade")
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Preparing upgrade proposal of proxy ${taskArgs.proxy} with new implementation ${taskArgs.newImplementation} to ${taskArgs.multisig}`
    )

    const NewImplementation = await hre.ethers.getContractFactory(taskArgs.newImplementation)
    const proposal = await hre.defender.proposeUpgrade(taskArgs.proxy, NewImplementation, {
      multisig: taskArgs.multisig,
    })

    console.log(`The upgrade proposal is created at ${proposal.url}\n`)
  })
