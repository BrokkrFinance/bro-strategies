import { Chain } from "../helper/HelperInterfaces"

export const Avalanche = function (): Chain {
  return {
    name: "avalanche",
    chainId: 43114,
    url: `${process.env["AVALANCHE_ARCHIVE_NODE_URL"]}`,
    forkAt: 30994300,
    whaleAddrs: {
      "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E": "0x625e7708f30ca75bfd92586e17077590c60eb4cd", // usdc
      "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB": "0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8", // eth
    },
  }
}
