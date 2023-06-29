import ArbitrumTokens from "../../constants/arbitrum/addresses/Tokens.json"
import AvalancheTokens from "../../constants/avalanche/addresses/Tokens.json"
import BSCTokens from "../../constants/bsc/addresses/Tokens.json"

export const NativeToken: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

export const DepositTokens: Map<string, string> = new Map<string, string>([
  ["avalanche", AvalancheTokens.usdc],
  ["bsc", BSCTokens.busd],
  ["arbitrum", ArbitrumTokens.usdc],
])

export const DepositTokenAmounts: Map<string, Map<string, string>> = new Map<string, Map<string, string>>([
  [
    "avalanche",
    new Map<string, string>([
      ["0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", "1"], // USDC on Avalanche
      ["0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "0.1"], // wAVAX on Avalanche
    ]),
  ],
  [
    "arbitrum-one",
    new Map<string, string>([
      ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "1"], // USDC on Arbitrum
      ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0.0006"], // wETH on Arbitrum
      ["0x912CE59144191C1204E64559FE8253a0e49E6548", "1"], // ARB on Arbitrum
    ]),
  ],
])
