import { ethers } from "hardhat"

export async function deployContract(name: string, args: any[], label?: string, options?: any) {
  let info = name
  if (label != undefined) {
    info = name + ":" + label
  }
  const contractFactory = await ethers.getContractFactory(name)
  let contract
  if (options != undefined) {
    contract = await contractFactory.deploy(...args, options)
  } else {
    contract = await contractFactory.deploy(...args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  console.info(`Deploying ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  console.info("... Completed!")
  return contract
}
