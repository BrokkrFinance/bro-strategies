// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IndexStrategyUpgradeable } from "../bases/IndexStrategyUpgradeable.sol";
import { IChainlinkAggregatorV3 } from "../dependencies/IChainlinkAggregatorV3.sol";
import { Constants } from "../libraries/Constants.sol";
import { Errors } from "../libraries/Errors.sol";
import { SwapAdapter } from "../libraries/SwapAdapter.sol";

contract IndexAvalanche is IndexStrategyUpgradeable {
    function equityValuation(bool maximize, bool includeAmmPrice)
        public
        view
        override
        returns (uint256)
    {
        uint256 totalSupply = indexToken.totalSupply();

        if (totalSupply == 0) {
            return 0;
        }

        uint256 amountWNATIVE = _getAmountWNATIVEFromExactIndex(totalSupply);

        uint256 priceWNATIVE = oracle.getPrice(
            wNATIVE,
            maximize,
            includeAmmPrice
        );

        return (amountWNATIVE * priceWNATIVE) / Constants.DECIMALS;
    }

    function addSwapRoute(
        address token0,
        address token1,
        address router,
        SwapAdapter.DEX dex,
        address pair
    ) external onlyOwner {
        SwapAdapter.PairData memory pairData = SwapAdapter.PairData(
            pair,
            abi.encode(0)
        );

        addSwapRoute(token0, token1, router, dex, pairData);
    }

    function addSwapRoute(
        address token0,
        address token1,
        address router,
        SwapAdapter.DEX dex,
        address pair,
        uint256 binStep
    ) external onlyOwner {
        SwapAdapter.PairData memory pairData = SwapAdapter.PairData(
            pair,
            abi.encode(binStep)
        );

        addSwapRoute(token0, token1, router, dex, pairData);
    }
}
