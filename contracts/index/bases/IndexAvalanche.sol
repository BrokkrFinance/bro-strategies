// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IndexStrategyUpgradeable } from "../bases/IndexStrategyUpgradeable.sol";
import { IChainlinkAggregatorV3 } from "../dependencies/IChainlinkAggregatorV3.sol";
import { Constants } from "../libraries/Constants.sol";
import { Errors } from "../libraries/Errors.sol";
import { SwapAdapter } from "../libraries/SwapAdapter.sol";

/**
 * @dev Contract IndexAvalanche is an extension of IndexStrategyUpgradeable.
 */
contract IndexAvalanche is IndexStrategyUpgradeable {
    /**
     * @dev Calculates the equity valuation.
     * @param maximize Boolean value to maximize.
     * @param includeAmmPrice Boolean value to include AMM price.
     * @return The equity valuation as a uint256.
     */
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

        uint256 amountWNATIVEUnit = _getAmountWNATIVEFromExactIndex(
            Constants.PRECISION
        );

        uint256 priceWNATIVE = oracle.getPrice(
            wNATIVE,
            maximize,
            includeAmmPrice
        );

        return
            (amountWNATIVEUnit * priceWNATIVE * totalSupply) /
            (Constants.DECIMALS * Constants.PRECISION);
    }

    /**
     * @dev Adds a swap route.
     * @param token The token address.
     * @param router The router address.
     * @param dex The DEX.
     * @param pair The pair address.
     */
    function addSwapRoute(
        address token,
        address router,
        SwapAdapter.DEX dex,
        address pair
    ) external onlyOwner {
        SwapAdapter.PairData memory pairData = SwapAdapter.PairData(
            pair,
            abi.encode(0)
        );

        addSwapRoute(token, router, dex, pairData);
    }

    /**
     * @dev Adds a swap route with a bin step.
     * @param token The token address.
     * @param router The router address.
     * @param dex The DEX.
     * @param pair The pair address.
     * @param binStep The bin step as a uint256.
     */
    function addSwapRoute(
        address token,
        address router,
        SwapAdapter.DEX dex,
        address pair,
        uint256 binStep
    ) external onlyOwner {
        SwapAdapter.PairData memory pairData = SwapAdapter.PairData(
            pair,
            abi.encode(binStep)
        );

        addSwapRoute(token, router, dex, pairData);
    }
}
