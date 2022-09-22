import { task } from "hardhat/config"

task("upgrade", "Upgrade a proxy contract to point to a new implementation contract")
  .addParam("proxy", "an address of proxy contract to be upgraded")
  .addParam("newImplementation", "the name of new implementation contract")
  .setAction(async (taskArgs, hre) => {
    console.log(
      `Preparing upgrade proposal of proxy ${taskArgs.proxy} with new implementation ${taskArgs.newImplementation}`
    )

    const NewImplementation = await hre.ethers.getContractFactory(taskArgs.newImplementation)
    const proposal = await hre.defender.proposeUpgrade(taskArgs.proxy, NewImplementation, {
      multisig: "0xE8855828fEC29dc6860A4362BCb386CCf6C0c601",
    })

    console.log(`The upgrade proposal is created at ${proposal.url}\n`)
  })
