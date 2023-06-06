import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers"
import { ethers } from "hardhat"

export async function removeInvestmentLimitsAndFees(investable: Contract, owner: SignerWithAddress): Promise<void> {
  const isStrategy = await investable.supportsInterface("0x00000000")

  if (!isStrategy) {
    const investables = await investable.getInvestables()

    for (let i = 0; i < investables.length; i++) {
      const investable = await ethers.getContractAt("IInvestable", await investables[i].investable)
      removeInvestmentLimitsAndFees(investable, owner)
    }
  }

  await setInvestmentLimits(investable, owner)
  await setFees(investable, owner)
}

async function setInvestmentLimits(
  investable: Contract,
  owner: SignerWithAddress,
  limit: BigInt = BigInt(1e40)
): Promise<void> {
  await investable.connect(owner).setTotalInvestmentLimit(limit)
  await investable.connect(owner).setInvestmentLimitPerAddress(limit)
}

async function setFees(investable: Contract, owner: SignerWithAddress, fee: number = 0): Promise<void> {
  await investable.connect(owner).setDepositFee(fee, [])
  await investable.connect(owner).setWithdrawalFee(fee, [])
  await investable.connect(owner).setPerformanceFee(fee, [])
  await investable.connect(owner).setManagementFee(fee, [])
}
