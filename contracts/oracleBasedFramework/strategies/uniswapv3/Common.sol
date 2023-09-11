// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IERC20UpgradeableExt } from "../../interfaces/IERC20UpgradeableExt.sol";

struct LiquidityIncreaseDesc {
    uint160 tickLower;
    uint160 tickUpper;
    uint24 token0Amount;
    uint24 token1Amount;
}

struct LiquidityDecreaseDesc {
    uint160 tickLower;
    uint160 tickUpper;
    uint24 liquidity;
}

struct SwapDesc {
    IERC20UpgradeableExt tokenFrom;
    IERC20UpgradeableExt tokenTo;
    IERC20UpgradeableExt tokenFromAmount;
}

struct InvestParams {
    SwapDesc[] swapDescs;
    LiquidityIncreaseDesc[] liquidityIncreaseDescs;
}

struct RangeDesc {
    uint160 tickLower;
    uint160 tickUpper;
}
