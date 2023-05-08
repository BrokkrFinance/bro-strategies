import { CoinAddrs } from "../../../../../scripts/helper/helper"

export function depositEthHoldBtcConfigAvalanche() {
  return {
    depositToken: {
      address: CoinAddrs.eth,
      digits: 18,
    },
    bluechipToken: {
      address: CoinAddrs.btc,
      digits: 18,
    },
    swap: {
      swapProviderId: 0,
      swapProviderAddress: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
      depositToBluechipPath: [CoinAddrs.eth, CoinAddrs.btc],
      bluechipToDepositPath: [CoinAddrs.btc, CoinAddrs.eth],
      depositToBluechipBins: [0],
      bluechipToDepositBins: [0],
    },
    emergency: {
      depositExitPath: [CoinAddrs.eth, CoinAddrs.usdt],
      bluechipExitPath: [CoinAddrs.btc, CoinAddrs.btc],
      depositExitBins: [0],
      bluechipExitBins: [0],
      depositExitTokenDigits: 6,
      bluechipExitTokenDigits: 18,
    },
    skipEmergencyExitTests: false,
  }
}
