import { ethers } from "hardhat"
import { CoinAddrs } from "../../../../../scripts/helper/helper"

export async function depositUsdcHoldEthConfigAvalanche() {
  const signers = await ethers.getSigners()

  return {
    depositToken: {
      address: CoinAddrs.usdc,
      digits: 6,
    },
    bluechipToken: {
      address: CoinAddrs.eth,
      digits: 18,
    },
    swap: {
      swapProviderId: 1,
      swapProviderAddress: "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3",
      depositToBluechipPath: [CoinAddrs.usdc, CoinAddrs.eth],
      bluechipToDepositPath: [CoinAddrs.eth, CoinAddrs.usdc],
      depositToBluechipBins: [15],
      bluechipToDepositBins: [15],
    },
    emergency: {
      depositExitPath: [CoinAddrs.usdc, CoinAddrs.usdt],
      bluechipExitPath: [CoinAddrs.eth, CoinAddrs.btc],
      depositExitBins: [0],
      bluechipExitBins: [0],
      depositExitTokenDigits: 6,
      bluechipExitTokenDigits: 8,
    },
    signers: signers,
  }
}
