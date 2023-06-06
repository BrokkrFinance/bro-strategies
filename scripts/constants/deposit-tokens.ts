import ArbitrumTokens from "../../constants/arbitrum/addresses/Tokens.json"
import AvalancheTokens from "../../constants/avalanche/addresses/Tokens.json"
import BSCTokens from "../../constants/bsc/addresses/Tokens.json"

export const UsdcTokens: Map<string, string> = new Map<string, string>([
  ["avalanche", AvalancheTokens.usdc],
  ["bsc", BSCTokens.busd],
  ["arbitrum", ArbitrumTokens.usdc],
])
