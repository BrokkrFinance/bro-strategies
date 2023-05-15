// SPDX-License-Identifier: BUSL-1.1

import { LPIndedStorageLib, LPIndexStorage } from "./libraries/LPIndexStorageLib.sol";
import { AssetSlot } from "./common/DataStructs.sol";

import { Dex } from "../../common/libraries/SwapProviderLibrary.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

pragma solidity ^0.8.0;

contract LPIndex {
    function deposit(
        address token,
        uint256 amountToInvest,
        address depositFor
    ) external {
        LPIndexStorage storage lpIndexstorage = LPIndedStorageLib.getStorage();
        AssetSlot[] storage assetSlots = lpIndexstorage.assetSlots;

        uint256 assetSlotsLength = assetSlots.length;
        for (uint256 i = 0; i < assetSlotsLength; i++) {}
    }
}
