// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import { IndexStrategyUpgradeable } from "../bases/IndexStrategyUpgradeable.sol";
import { IChainlinkAggregatorV3 } from "../dependencies/IChainlinkAggregatorV3.sol";
import { Constants } from "../libraries/Constants.sol";
import { Errors } from "../libraries/Errors.sol";
import { SwapAdapter } from "../libraries/SwapAdapter.sol";

contract IndexAvalancheDeFi is UUPSUpgradeable, IndexStrategyUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IndexStrategyInitParams calldata initParams)
        external
        initializer
    {
        __UUPSUpgradeable_init();
        __IndexStrategyUpgradeable_init(initParams);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

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

        uint256 amountWETH = _getAmountWETHFromExactIndex(totalSupply);

        uint256 priceWETH = oracle.getPrice(wETH, maximize, includeAmmPrice);

        return (amountWETH * priceWETH) / Constants.DECIMALS;
    }

    function setSwapRoute(
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

        setSwapRoute(token0, token1, router, dex, pairData);
    }

    function setSwapRoute(
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

        setSwapRoute(token0, token1, router, dex, pairData);
    }
}
