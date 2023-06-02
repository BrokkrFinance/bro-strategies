import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"

export async function mint(
  indexStrategy: Contract,
  indexToken: Contract,
  spender: SignerWithAddress,
  recipient: SignerWithAddress,
  token: Contract,
  tokenAmount: BigNumber,
  reverted: boolean = false
) {
  const [amountIndex] = await indexStrategy.connect(spender).getAmountIndexFromToken(token.address, tokenAmount)

  const indexTokenBalanceBefore = await indexToken.balanceOf(recipient.address)

  await token.connect(spender).approve(indexStrategy.address, tokenAmount)

  if (reverted) {
    await expect(
      indexStrategy.connect(spender).mintIndexFromToken(token.address, tokenAmount, amountIndex, recipient.address)
    ).to.be.reverted
  } else {
    await expect(
      indexStrategy.connect(spender).mintIndexFromToken(token.address, tokenAmount, amountIndex, recipient.address)
    ).to.emit(indexStrategy, "Mint")

    const indexTokenBalanceAfter = await indexToken.balanceOf(recipient.address)

    const indexTokenBalance = indexTokenBalanceAfter - indexTokenBalanceBefore

    expect(indexTokenBalance == amountIndex).to.be.true
  }
}

export async function burn(
  indexStrategy: Contract,
  indexToken: Contract,
  spender: SignerWithAddress,
  recipient: SignerWithAddress,
  token: Contract,
  indexAmount: BigNumber,
  slippageTolerance: BigNumber,
  reverted: boolean = false
) {
  const amountToken = await indexStrategy.connect(spender).getAmountTokenFromExactIndex(token.address, indexAmount)
  const amountTokenMin = amountToken.mul(BigNumber.from(1e2).sub(slippageTolerance)).div(1e2)

  const tokenBalanceBefore = await token.balanceOf(recipient.address)

  await indexToken.connect(spender).approve(indexStrategy.address, indexAmount)

  if (reverted) {
    await expect(
      indexStrategy
        .connect(spender)
        .burnExactIndexForToken(token.address, amountTokenMin, indexAmount, recipient.address)
    ).to.be.reverted
  } else {
    await expect(
      indexStrategy
        .connect(spender)
        .burnExactIndexForToken(token.address, amountTokenMin, indexAmount, recipient.address)
    ).to.emit(indexStrategy, "Burn")

    const tokenBalanceAfter = await token.balanceOf(recipient.address)

    const tokenBalance = tokenBalanceAfter - tokenBalanceBefore

    expect(tokenBalance >= amountTokenMin).to.be.true
  }
}
