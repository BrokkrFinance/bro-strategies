//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IOracle {
    function getPrice(
        address token,
        bool maximise,
        bool includeAmmPrice,
        bool useSwapPricing
    ) external returns (uint256);
}
