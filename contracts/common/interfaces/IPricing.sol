//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.8;

interface Pricing {
    function sharePricePerWholeUnit(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) external returns (address, uint256);
}
