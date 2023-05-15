// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { AssetSlot } from "../common/DataStructs.sol";

struct LPIndexStorage {
    AssetSlot[] assetSlots;
    mapping(address => mapping(address => uint256)) swapProvider;
}

library LPIndedStorageLib {
    // keccak256("brokkr.storage.lpindex.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0x1593c40610eaf220d752b0b49948411c06b29cb594d886a5509f1fb029fea597;

    function getStorage() internal pure returns (LPIndexStorage storage ts) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
