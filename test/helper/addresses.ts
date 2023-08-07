export const WhaleAddrs: Map<string, [string, string][]> = new Map<string, [string, string][]>([
  [
    "avalanche",
    [
      ["0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", "0x625E7708f30cA75bfd92586e17077590C60eb4cD"], // USDC, Aave: aUSDC Token V3
      ["0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97"], // wAVAX, Aave: aWAVAX Token V3
    ],
  ],
  [
    "arbitrum",
    [
      ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "0x489ee077994B6658eAfA855C308275EAd8097C4A"], // USDC, GMX: Vault
      ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0x489ee077994B6658eAfA855C308275EAd8097C4A"], // wETH, GMX: Vault
      ["0x912CE59144191C1204E64559FE8253a0e49E6548", "0xF3FC178157fb3c87548bAA86F9d24BA38E649B58"], // ARB, Arbitrum Foundation: DAO Treasury
    ],
  ],
])
