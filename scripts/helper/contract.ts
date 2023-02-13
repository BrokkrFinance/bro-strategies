import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Contract } from "ethers"
import { ethers } from "hardhat"

export async function removeInvestmentLimitsAndFees(investable: Contract, owner: SignerWithAddress): Promise<void> {
  const isPortfolio = await investable.supportsInterface("0x2ac9cdaa")
  const isStrategy = await investable.supportsInterface("0x00000000")

  if (isPortfolio === false && isStrategy === false) {
    throw new Error("The given investable is neither portfolio nor strategy.")
  }

  if (isPortfolio === true) {
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
  limit: BigInt = BigInt(1e20)
): Promise<void> {
  await investable.connect(owner).setTotalInvestmentLimit(limit)
  await investable.connect(owner).setInvestmentLimitPerAddress(limit)
}

async function setFees(investable: Contract, owner: SignerWithAddress, fee: number = 0): Promise<void> {
  await investable.connect(owner).setDepositFee(fee, [])
  await investable.connect(owner).setWithdrawalFee(fee, [])
  await investable.connect(owner).setPerformanceFee(fee, [])
}
