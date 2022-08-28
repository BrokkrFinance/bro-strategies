import { testStrategy } from "../Unified.test"

const ADDRESSES = {
  stargateRouter: "0x45a01e4e04f14f7a4a6702c74187c5f6222033cd",
  stargateUsdcPool: "0x1205f31718499dbf1fca446663b532ef87481fe1",
  stargateUsdtPool: "0x29e38769f23701a2e4a8ef0492e19da4604be62c",
  stargateLpStaking: "0x8731d54e9d02c286767d56ac03e8037c07e01e98",
  stargateUsdcLpToken: "0x1205f31718499dbf1fca446663b532ef87481fe1",
  stargateUsdtLpToken: "0x29e38769f23701a2e4a8ef0492e19da4604be62c",
  stargateStgToken: "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590",
}

testStrategy(
  "Stargate USDC Strategy",
  "Stargate",
  [
    ADDRESSES.stargateRouter,
    ADDRESSES.stargateUsdcPool,
    ADDRESSES.stargateLpStaking,
    ADDRESSES.stargateUsdcLpToken,
    ADDRESSES.stargateStgToken,
  ],
  []
)

testStrategy(
  "Stargate USDT Strategy",
  "Stargate",
  [
    ADDRESSES.stargateRouter,
    ADDRESSES.stargateUsdtPool,
    ADDRESSES.stargateLpStaking,
    ADDRESSES.stargateUsdtLpToken,
    ADDRESSES.stargateStgToken,
  ],
  []
)
