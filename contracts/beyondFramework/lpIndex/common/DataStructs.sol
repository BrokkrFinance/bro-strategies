// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { Dex } from "../../../common/libraries/SwapProviderLibrary.sol";

struct AssetSlot {
    uint256 totalAssets;
    mapping(address => uint256) userAssets;
    address lpPair;
    address tokenA;
    address tokenB;
    uint8 liquidityProviderId;
    address liquidityProviderAddress;
}

struct SwapProvider {
    Dex dex;
    address routerAddress;
    bytes data;
}
