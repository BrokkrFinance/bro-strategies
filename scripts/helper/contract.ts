import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"

export async function removeInvestmentLimitsAndFees(investable: Contract, owner: SignerWithAddress): Promise<void> {
  const humanReadableName = await investable.humanReadableName()

  if (humanReadableName.endsWith("portfolio")) {
    const portfolio = await ethers.getContractAt("IPortfolio", investable.address)
    const investables = await portfolio.getInvestables()

    for (let i = 0; i < investables.length; i++) {
      const _investable = await ethers.getContractAt("IInvestable", await investables[i].investable)
      await removeInvestmentLimitsAndFees(_investable, owner)
    }
  }

  await setInvestmentLimits(investable, owner)
  await setFees(investable, owner)
}

async function setInvestmentLimits(
  investable: Contract,
  owner: SignerWithAddress,
  limit: BigNumber = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935") // 2^256 - 1
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
