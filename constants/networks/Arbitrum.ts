import { Network } from "../../test/helper/interfaces/network"

export const Arbitrum = function (): Network {
  return {
    name: "arbitrum",
    url: `${process.env["ARBITRUM_ARCHIVE_NODE_URL"]}`,
    chainId: 42161,
  }
}
