import { Chain } from "../helper/HelperInterfaces"

export const Arbitrum = function (): Chain {
  return {
    name: "arbitrum",
    chainId: 42161,
    url: `${process.env["ARBITRUM_ARCHIVE_NODE_URL"]}`,
    forkAt: 98472000,
    whaleAddrs: {
      "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": "0x48a29e756cc1c097388f3b2f3b570ed270423b3d", // usdc
    },
  }
}
