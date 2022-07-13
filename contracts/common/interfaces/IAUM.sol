//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IAUM {
    struct Asset {
        address asset;
        uint256 balance;
    }

    function getAssets() external view returns (Asset[] memory);

    function getTotalAUM(bool shouldMaximise, bool shouldIncludeAmmPrice)
        external
        view
        returns (uint256);

    function getInvestmentTokenSupply() external view returns (uint256);

    function getInvestmentTokenBalanceOf(address user)
        external
        view
        returns (uint256);
}
