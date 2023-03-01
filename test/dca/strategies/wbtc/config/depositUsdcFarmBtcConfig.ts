import { ethers } from "hardhat"
import { CoinAddrs } from "../../../../../scripts/helper/helper"

export async function depositUsdcFarmBtcConfig() {
  const signers = await ethers.getSigners()

  return {
    depositToken: {
      address: CoinAddrs.usdc,
      digits: 6,
    },
    bluechipToken: {
      address: CoinAddrs.btc,
      digits: 8,
    },
    swap: {
      swapProviderId: 0,
      swapProviderAddress: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
      depositToBluechipPath: [CoinAddrs.usdc, CoinAddrs.btc],
      bluechipToDepositPath: [CoinAddrs.btc, CoinAddrs.usdc],
      depositToBluechipBins: [0],
      bluechipToDepositBins: [0],
    },
    emergency: {
      depositExitPath: [CoinAddrs.usdc, CoinAddrs.usdt],
      bluechipExitPath: [CoinAddrs.btc, CoinAddrs.eth],
      depositExitBins: [0],
      bluechipExitBins: [0],
      depositExitTokenDigits: 6,
      bluechipExitTokenDigits: 18,
    },
    signers: signers,
  }
}
