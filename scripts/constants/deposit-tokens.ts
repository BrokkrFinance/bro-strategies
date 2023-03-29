import AvalancheTokens from "../../constants/avalanche/addresses/Tokens.json"
import BSCTokens from "../../constants/bsc/addresses/Tokens.json"

export const DepositTokens: Map<string, string> = new Map<string, string>([
  ["avalanche", AvalancheTokens.usdc],
  ["bsc", BSCTokens.busd],
])