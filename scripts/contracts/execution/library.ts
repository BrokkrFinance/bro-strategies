import { readLiveConfig, writeLiveConfig } from "../../files/io"
import { getLiveConfigPath } from "../../files/paths"
import { LibraryArgs } from "../../interfaces/parameters"
import { Libraries } from "../../types/library"
import { deployLibrary } from "../core/library"
import { verifyContract } from "../core/verify"

export async function deployLibraries(network: string, libraryArgs: LibraryArgs): Promise<Libraries> {
  if (libraryArgs.libraries.length == 0) {
    return {}
  }

  const libraries: Libraries = {}

  for (const libraryInfo of libraryArgs.libraries) {
    const dependencies: Libraries = {}

    // Get dependencies.
    for (const name of libraryInfo.dependencies) {
      if (name.length == 0) {
        break
      }

      dependencies[name] = readLiveConfig({
        network: network,
        type: "library",
        name: name,
      }).address
    }

    console.log(`Library: Deploy ${libraryInfo.name}.`)

    // Deploy library.
    const library = await deployLibrary(libraryInfo.name, dependencies)

    console.log(`Library: ${library.name} is deployed at ${library.address}`)

    // Write live config file.
    const investable = {
      network: network,
      type: "library",
      name: libraryInfo.name,
    }
    const liveConfig = {
      name: libraryInfo.name,
      address: library.address,
      owner: "",
    }

    writeLiveConfig(investable, liveConfig)

    console.log(`Library: Corresponding live config is created at ${getLiveConfigPath(investable)}.`)

    // Verify the library.
    console.log("Library: Verify the library.\n")

    await verifyContract(library.address)

    libraries[libraryInfo.name] = library.address
  }

  return libraries
}
