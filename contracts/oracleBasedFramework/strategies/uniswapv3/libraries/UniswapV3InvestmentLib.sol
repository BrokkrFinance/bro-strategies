// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { RangeDesc, LiquidityIncrease, LiquidityDecrease, LiquidityIncreaseCalcDesc, UNISWAP_V3_CALC_DIGITS, UNISWAP_V3_CALC_PRECISION } from "../Common.sol";
import { UniswapV3StorageLib, UniswapV3Storage } from "../libraries/UniswapV3StorageLib.sol";
import { UniswapV3UtilsLib } from "../libraries/UniswapV3UtilsLib.sol";
import { IInvestmentToken } from "../../../InvestmentToken.sol";
import { Math } from "../../../libraries/Math.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import "hardhat/console.sol";

library UniswapV3InvestmentLib {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function initialDeposit(
        uint256 initialInvestment,
        LiquidityIncrease[] calldata liquidityIncreases
    ) external {
        UniswapV3Storage storage strategyStorage = UniswapV3StorageLib
            .getStorage();

        uint160 sqrtPriceX96 = UniswapV3UtilsLib.getSqrtPriceX96(
            strategyStorage.pool
        );
        uint256 token0PriceInDepositToken = strategyStorage
            .priceOracle
            .getPrice(
                strategyStorage.depositToken,
                strategyStorage.token0,
                UNISWAP_V3_CALC_DIGITS,
                false,
                false
            );
        uint256 token1PriceInDepositToken = strategyStorage
            .priceOracle
            .getPrice(
                strategyStorage.depositToken,
                strategyStorage.token1,
                UNISWAP_V3_CALC_DIGITS,
                false,
                false
            );

        LiquidityIncreaseCalcDesc[]
            memory liquidityIncreaseCalcDescs = calculateInitialDepositTokenAmounts(
                initialInvestment,
                liquidityIncreases
            );

        uint256 token0TotalAmount;
        uint256 token1TotalAmount;
        (
            liquidityIncreaseCalcDescs,
            token0TotalAmount,
            token1TotalAmount
        ) = calculatePoolTokenAmounts(
            sqrtPriceX96,
            token0PriceInDepositToken,
            token1PriceInDepositToken,
            liquidityIncreaseCalcDescs
        );
    }

    function calculateInitialDepositTokenAmounts(
        uint256 initialInvestment,
        LiquidityIncrease[] calldata liquidityIncreases
    )
        internal
        view
        returns (LiquidityIncreaseCalcDesc[] memory liquidityIncreaseCalcDescs)
    {
        UniswapV3Storage storage strategyStorage = UniswapV3StorageLib
            .getStorage();

        uint256 rangeDescsLength = strategyStorage.rangeDescs.length;
        liquidityIncreaseCalcDescs = new LiquidityIncreaseCalcDesc[](
            rangeDescsLength
        );
        for (uint256 i = 0; i < rangeDescsLength; ++i) {
            liquidityIncreaseCalcDescs[i].sqrtRatioAX96 = strategyStorage
                .rangeDescs[i]
                .sqrtRatioAX96;
            liquidityIncreaseCalcDescs[i].sqrtRatioBX96 = strategyStorage
                .rangeDescs[i]
                .sqrtRatioBX96;
            liquidityIncreaseCalcDescs[i].depositTokenAmount =
                (initialInvestment * liquidityIncreases[i].percentage) /
                Math.SHORT_FIXED_DECIMAL_FACTOR;
        }
    }

    function calculatePoolTokenAmounts(
        uint160 sqrtPriceX96,
        uint256 token0PriceInDepositToken,
        uint256 token1PriceInDepositToken,
        LiquidityIncreaseCalcDesc[] memory liquidityIncreaseCalcDescsIn
    )
        internal
        view
        returns (
            LiquidityIncreaseCalcDesc[] memory liquidityIncreaseCalcDescsOut,
            uint256 token0TotalAmount,
            uint256 token1TotalAmount
        )
    {
        console.log("sqrtPriceX96:", sqrtPriceX96);

        uint256 liquidityIncreaseCalcDescsInLength = liquidityIncreaseCalcDescsIn
                .length;
        for (uint256 i = 0; i < liquidityIncreaseCalcDescsInLength; ++i) {
            uint256 K = ((liquidityIncreaseCalcDescsIn[i].sqrtRatioBX96 -
                sqrtPriceX96) * UNISWAP_V3_CALC_PRECISION) /
                ((sqrtPriceX96 -
                    liquidityIncreaseCalcDescsIn[i].sqrtRatioAX96) *
                    sqrtPriceX96 *
                    liquidityIncreaseCalcDescsIn[i].sqrtRatioBX96);
            console.log("K:", K);

            liquidityIncreaseCalcDescsIn[i].token0Amount =
                (liquidityIncreaseCalcDescsIn[i].depositTokenAmount *
                    K *
                    token1PriceInDepositToken *
                    token0PriceInDepositToken) /
                (UNISWAP_V3_CALC_PRECISION *
                    token0PriceInDepositToken +
                    K *
                    token1PriceInDepositToken) /
                UNISWAP_V3_CALC_PRECISION /
                UNISWAP_V3_CALC_PRECISION /
                UNISWAP_V3_CALC_PRECISION;
            console.log(
                "token0Amount:",
                liquidityIncreaseCalcDescsIn[i].token0Amount
            );
            token0TotalAmount += liquidityIncreaseCalcDescsIn[i].token0Amount;
        }

        liquidityIncreaseCalcDescsOut = liquidityIncreaseCalcDescsIn;
    }
}
