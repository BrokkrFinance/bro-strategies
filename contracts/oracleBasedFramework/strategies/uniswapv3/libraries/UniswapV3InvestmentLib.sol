// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { RangeDesc, LiquidityChangeDesc } from "../Common.sol";
import { UniswapV3StorageLib, UniswapV3Storage } from "../libraries/UniswapV3StorageLib.sol";
import { UniswapV3UtilsLib } from "../libraries/UniswapV3UtilsLib.sol";
import { IInvestmentToken } from "../../../InvestmentToken.sol";
import { Math } from "../../../libraries/Math.sol";
import { NameValuePair } from "../../../Common.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import "hardhat/console.sol";

library UniswapV3InvestmentLib {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function deposit(uint256 amount, NameValuePair[] calldata params)
        external
    {}
}
