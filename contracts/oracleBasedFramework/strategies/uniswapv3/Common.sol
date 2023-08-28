// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

struct LiquidityDecrease {
    uint160 sqrtRatioAX96;
    uint160 sqrtRatioBX96;
    uint128 liquidity;
}

struct LiquidityIncrease {
    uint160 sqrtRatioAX96;
    uint160 sqrtRatioBX96;
    uint24 percentage;
}

struct LiquidityIncreaseCalcDesc {
    uint160 sqrtRatioAX96;
    uint160 sqrtRatioBX96;
    uint256 depositTokenAmount;
    uint256 token0Amount;
    uint256 token1Amount;
}

struct RangeDesc {
    uint160 sqrtRatioAX96;
    uint160 sqrtRatioBX96;
}

uint8 constant UNISWAP_V3_CALC_DIGITS = 18;
uint256 constant UNISWAP_V3_CALC_PRECISION = 10**UNISWAP_V3_CALC_DIGITS;
