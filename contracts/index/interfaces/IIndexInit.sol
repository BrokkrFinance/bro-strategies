// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IChainlinkAggregatorV3 } from "../dependencies/IChainlinkAggregatorV3.sol";
import { SwapAdapter } from "../libraries/SwapAdapter.sol";
import { IIndexStrategy } from "./IIndexStrategy.sol";

interface IIndexInit {
    struct IndexStrategyInitParams {
        address wETH;
        address indexToken;
        Component[] components;
        SwapRoute[] swapRoutes;
        address[] whitelistedTokens;
        address oracle;
        uint256 equityValuationLimit;
    }

    struct Component {
        address token;
        uint256 weight;
    }

    struct SwapRoute {
        address token0;
        address token1;
        address router;
        SwapAdapter.DEX dex;
        SwapAdapter.PairData pairData;
    }
}
