import { Contract } from "ethers"
import { ethers } from "hardhat"
import { Libraries } from "../../types/library"

export async function deployLibrary(name: string, dependencies: Libraries): Promise<Contract> {
  const Library = await ethers.getContractFactory(name, { libraries: dependencies })
  const library = await Library.deploy()

  return library
}
