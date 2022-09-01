import { ethers } from "hardhat"
import erc20Abi from "./abi/erc20.json"

export async function getTokenContract(address: string) {
  return await ethers.getContractAt(erc20Abi, address)
}
