import { AdminClient, ProposalResponseWithUrl } from "defender-admin-client/lib/api"
import { PartialContract } from "defender-admin-client/lib/models/proposal"
import { Contract, Signer } from "ethers"
import { config, defender, ethers, upgrades } from "hardhat"
import { readLiveConfig, readUpgradeConfig } from "../../files/io"
import { LiveConfig, UpgradeConfig } from "../../interfaces/configs"
import { Investable } from "../../interfaces/investable"
import { Library } from "../../interfaces/library"
import { UpgradeOptions } from "../../interfaces/options"
import { Libraries } from "../../types/library"
import { verifyContract } from "../core/verify"
import { deployLibraries } from "./library"

export async function upgrade(investable: Investable, options?: UpgradeOptions): Promise<Contract> {
  if (options?.forkEnabled === true) {
    return await upgradeForking(investable)
  } else {
    // Switch to target network.
    const hre = require("hardhat")

    await hre.changeNetwork(investable.network)

    return await upgradeMainnet(investable)
  }
}

async function upgradeForking(investable: Investable): Promise<Contract> {
  // Configs.
  const liveConfig: LiveConfig = readLiveConfig(investable)
  const upgradeConfigs: UpgradeConfig[] = await readUpgradeConfig(investable)

  // Signer.
  let signer: Signer | undefined = undefined

  if (liveConfig.owner !== undefined) {
    signer = await ethers.getImpersonatedSigner(liveConfig.owner)
  } else if (liveConfig.multisig !== undefined) {
    signer = await ethers.getImpersonatedSigner(liveConfig.multisig)
  }

  // Upgrade the given investable and its all relevant investables.
  for (let upgradeConfig of upgradeConfigs) {
    let call: { fn: string; args?: unknown[] } | undefined = undefined
    if (upgradeConfig.functionName !== undefined && upgradeConfig.functionArgs !== undefined) {
      call = {
        fn: upgradeConfig.functionName,
        args: upgradeConfig.functionArgs,
      }
    }

    // Deploy libraries.
    let libraries: Libraries = {}

    if (upgradeConfig.libraries !== undefined) {
      libraries = await deployLibraries(investable.network, {
        libraries: upgradeConfig.libraries as unknown as Library[],
      })
    }

    // Contract factories.
    const NewImplementation = await ethers.getContractFactory(upgradeConfig.newImplementation, {
      signer,
      libraries,
    })
    const newImplementation = await upgrades.upgradeProxy(upgradeConfig.proxy, NewImplementation, {
      call,
      kind: "uups",
      unsafeAllow: ["external-library-linking"],
    })

    await newImplementation.deployed()
  }

  // Return the given investable contract.
  return await ethers.getContractAt(liveConfig.name, liveConfig.address)
}

async function upgradeMainnet(investable: Investable): Promise<Contract> {
  // Configs.
  const liveConfig: LiveConfig = readLiveConfig(investable)
  const upgradeConfigs: UpgradeConfig[] = await readUpgradeConfig(investable)

  // Signer.
  let signer: string | undefined = undefined

  if (liveConfig.owner !== undefined) {
    signer = liveConfig.owner
  } else if (liveConfig.multisig !== undefined) {
    signer = liveConfig.multisig
  }

  for (let upgradeConfig of upgradeConfigs) {
    // Create upgrade proposal.
    let proposal: ProposalResponseWithUrl
    let newImplementationAddress: string | undefined

    // Deploy libraries if any.
    let libraries: Libraries = {}

    if (upgradeConfig.libraries !== undefined) {
      libraries = await deployLibraries(investable.network, {
        libraries: upgradeConfig.libraries as unknown as Library[],
      })
    } else {
      libraries = {}
    }

    const NewImplementation = await ethers.getContractFactory(upgradeConfig.newImplementation, { libraries })

    if (upgradeConfig.functionName !== undefined && upgradeConfig.functionArgs !== undefined) {
      // Upgrade and call.
      const defenderConfig = config.defender

      if (defenderConfig === undefined) {
        throw new Error("Upgrade: Failed to find Defender config from HardhatRuntimeEnvironment.")
      }

      const defenderAdmin = new AdminClient(defenderConfig)

      const data = NewImplementation.interface.encodeFunctionData(
        upgradeConfig.functionName,
        upgradeConfig.functionArgs
      )

      newImplementationAddress = (await upgrades.prepareUpgrade(upgradeConfig.proxy, NewImplementation, {
        unsafeAllow: ["external-library-linking"],
      })) as string

      proposal = await defenderAdmin.createProposal({
        contract: { address: upgradeConfig.proxy, network: investable.network as PartialContract["network"] },
        title: `Upgrade to ${newImplementationAddress.slice(0, 10)} and call ${upgradeConfig.functionName}`,
        description: `Upgrade contract implementation to ${newImplementationAddress} and call ${upgradeConfig.functionName} with ${upgradeConfig.functionArgs}`,
        type: "custom",
        functionInterface: {
          name: "upgradeToAndCall",
          inputs: [
            { type: "address", name: "newImplementation" },
            { type: "bytes", name: "data" },
          ],
        },
        functionInputs: [newImplementationAddress, data],
        via: signer!,
        viaType: "Gnosis Safe",
      })
    } else {
      // Upgrade.
      proposal = await defender.proposeUpgrade(upgradeConfig.proxy, NewImplementation, {
        multisig: signer!,
        unsafeAllow: ["external-library-linking"],
      })

      newImplementationAddress = proposal.metadata?.newImplementationAddress
    }

    // Verify the new implementation contract.
    console.log("Upgrade: Verify new implementation contract.\n")

    if (newImplementationAddress === undefined) {
      console.log("Upgrade: Couldn't find new implementation contract's address. Skip verification.")
    } else {
      await verifyContract(newImplementationAddress)
      console.log()
    }

    console.log(`Upgrade: The upgrade proposal is created at ${proposal.url}\n`)
  }

  // Return the given investable contract.
  return await ethers.getContractAt(liveConfig.name, liveConfig.address)
}
