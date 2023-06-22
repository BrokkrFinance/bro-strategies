import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { BigNumber, Contract } from "ethers"
import { ethers } from "hardhat"

export async function mint(
  indexStrategy: Contract,
  indexToken: Contract,
  spender: SignerWithAddress,
  recipient: SignerWithAddress,
  token: Contract | undefined,
  tokenAmount: BigNumber,
  reverted: boolean = false
) {
  const indexTokenBalanceBefore = await indexToken.balanceOf(recipient.address)

  let amountIndex: BigNumber

  if (token === undefined) {
    ;[amountIndex] = await indexStrategy.connect(spender).getAmountIndexFromNATIVE(tokenAmount)

    if (reverted) {
      await expect(
        indexStrategy.connect(spender).mintIndexFromNATIVE(amountIndex, recipient.address, { value: tokenAmount })
      ).to.be.reverted
    } else {
      await expect(
        indexStrategy.connect(spender).mintIndexFromNATIVE(amountIndex, recipient.address, { value: tokenAmount })
      ).to.emit(indexStrategy, "Mint")
    }
  } else {
    ;[amountIndex] = await indexStrategy.connect(spender).getAmountIndexFromToken(token.address, tokenAmount)

    await token.connect(spender).approve(indexStrategy.address, tokenAmount)

    if (reverted) {
      await expect(
        indexStrategy.connect(spender).mintIndexFromToken(token.address, tokenAmount, amountIndex, recipient.address)
      ).to.be.reverted
    } else {
      await expect(
        indexStrategy.connect(spender).mintIndexFromToken(token.address, tokenAmount, amountIndex, recipient.address)
      ).to.emit(indexStrategy, "Mint")
    }
  }

  if (reverted !== true) {
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
  token: Contract | undefined,
  indexAmount: BigNumber,
  slippageTolerance: BigNumber,
  reverted: boolean = false
) {
  if (token === undefined) {
    const nativeBalanceBefore = await ethers.provider.getBalance(recipient.address)

    const amountNative = await indexStrategy.connect(spender).getAmountNATIVEFromExactIndex(indexAmount)
    const amountNativeMin = amountNative.mul(BigNumber.from(1e2).sub(slippageTolerance)).div(1e2)

    await indexToken.connect(spender).approve(indexStrategy.address, indexAmount)

    if (reverted) {
      await expect(
        indexStrategy.connect(spender).burnExactIndexForNATIVE(amountNativeMin, indexAmount, recipient.address)
      ).to.be.reverted
    } else {
      await expect(
        indexStrategy.connect(spender).burnExactIndexForNATIVE(amountNativeMin, indexAmount, recipient.address)
      ).to.emit(indexStrategy, "Burn")

      const nativeBalanceAfter = await ethers.provider.getBalance(recipient.address)

      const nativeBalance = nativeBalanceAfter.sub(nativeBalanceBefore)

      expect(nativeBalance.gte(amountNativeMin)).to.be.true
    }
  } else {
    const tokenBalanceBefore = await token.balanceOf(recipient.address)

    const amountToken = await indexStrategy.connect(spender).getAmountTokenFromExactIndex(token.address, indexAmount)
    const amountTokenMin = amountToken.mul(BigNumber.from(1e2).sub(slippageTolerance)).div(1e2)

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
}
