//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IPriceOracle {
    function getPrice(
        address token,
        bool shouldMaximize,
        bool includeAmmPrice
    ) external view returns (uint256);
}
