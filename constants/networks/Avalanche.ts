import { Network } from "../../test/helper/interfaces/network"

export const Avalanche = function (): Network {
  return {
    name: "avalanche",
    url: `${process.env["AVALANCHE_ARCHIVE_NODE_URL"]}`,
    chainId: 43114,
  }
}
