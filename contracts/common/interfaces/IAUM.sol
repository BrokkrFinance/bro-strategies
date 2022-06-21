//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IAUM {
    struct Assets {
        address[] asset;
        uint256[] balance;
    }

    function getAssetsUnderManagement() external returns (Assets[] memory);
}
