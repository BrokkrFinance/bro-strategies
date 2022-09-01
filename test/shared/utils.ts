import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import erc20Abi from "./abi/erc20.json"

const ERROR_RANGE = 5 // ±5%
const ERROR_RANGE_PRECISION = 1e2

export function getErrorRange(value: BigNumber) {
  let errorRange = value.mul(ERROR_RANGE).div(ERROR_RANGE_PRECISION)

  return errorRange > BigNumber.from(0) ? errorRange : value
}

// TODO: To be deleted.
export async function airdropToken(from: SignerWithAddress, to: SignerWithAddress, token: Contract, amount: BigNumber) {
  await token.connect(from).transfer(to.address, amount)
}

export async function getTokenContract(address: string) {
  return await ethers.getContractAt(erc20Abi, address)
}
