//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

struct CashStorage {
    uint256 balance;
}

library CashStorageLib {
    // keccak256("block42.storage.cash.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0x9956177b84d49ce93a0531b17a233a9dee8ff4090acccf6b5b9bdc395372ebff;

    function getStorage() internal pure returns (CashStorage storage ts) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
