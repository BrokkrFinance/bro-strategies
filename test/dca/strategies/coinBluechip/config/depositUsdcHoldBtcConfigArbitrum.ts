import { ethers } from "hardhat"
import * as Tokens from "../../../../../constants/arbitrum/addresses/Tokens.json"

export async function depositUsdcHoldBtcConfigArbitrum() {
  const signers = await ethers.getSigners()

  return {
    depositToken: {
      address: Tokens.usdc,
      digits: 6,
    },
    bluechipToken: {
      address: Tokens.wBtc,
      digits: 8,
    },
    swap: {
      swapProviderId: 1,
      swapProviderAddress: "0x7BFd7192E76D950832c77BB412aaE841049D8D9B",
      depositToBluechipPath: [Tokens.usdc, Tokens.wEth, Tokens.wBtc],
      bluechipToDepositPath: [Tokens.wBtc, Tokens.wEth, Tokens.usdc],
      depositToBluechipBins: [15, 10],
      bluechipToDepositBins: [10, 15],
    },
    emergency: {
      depositExitPath: [Tokens.usdc, Tokens.usdt],
      bluechipExitPath: [Tokens.wBtc, Tokens.wEth],
      depositExitBins: [1],
      bluechipExitBins: [10],
      depositExitTokenDigits: 6,
      bluechipExitTokenDigits: 18,
    },
    signers: signers,
  }
}
