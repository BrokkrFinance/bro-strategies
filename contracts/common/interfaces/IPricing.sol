//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.8;

interface Pricing {
    function sharePricePerWholeUnit() external returns (address, uint256);
}
