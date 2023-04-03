import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"

export async function mint(
  indexStrategy: Contract,
  indexToken: Contract,
  user: SignerWithAddress,
  token: Contract,
  tokenAmount: BigNumber
) {
  const [amountIndex] = await indexStrategy.connect(user).getAmountIndexFromToken(token.address, tokenAmount)

  const indexTokenBalanceBefore = await indexToken.balanceOf(user.address)

  await token.connect(user).approve(indexStrategy.address, tokenAmount)
  await expect(
    indexStrategy.connect(user).mintExactIndexFromToken(token.address, tokenAmount, amountIndex, user.address)
  ).to.emit(indexStrategy, "Mint")

  const indexTokenBalanceAfter = await indexToken.balanceOf(user.address)

  const indexTokenBalance = indexTokenBalanceAfter - indexTokenBalanceBefore

  expect(indexTokenBalance == amountIndex).to.be.true
}

export async function burn(
  indexStrategy: Contract,
  indexToken: Contract,
  user: SignerWithAddress,
  token: Contract,
  indexAmount: BigNumber,
  slippageTolerance: BigNumber
) {
  const amountToken = await indexStrategy.connect(user).getAmountTokenFromExactIndex(token.address, indexAmount)
  const amountTokenMin = amountToken.mul(BigNumber.from(1e2).sub(slippageTolerance)).div(1e2)

  const tokenBalanceBefore = await token.balanceOf(user.address)

  await indexToken.connect(user).approve(indexStrategy.address, indexAmount)
  await expect(
    indexStrategy.connect(user).burnExactIndexForToken(token.address, amountTokenMin, indexAmount, user.address)
  ).to.emit(indexStrategy, "Burn")

  const tokenBalanceAfter = await token.balanceOf(user.address)

  const tokenBalance = tokenBalanceAfter - tokenBalanceBefore

  expect(tokenBalance >= amountTokenMin).to.be.true
}
