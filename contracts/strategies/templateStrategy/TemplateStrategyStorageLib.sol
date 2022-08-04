//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

struct TemplateStrategyStorage {
    string dataA;
    uint256 dataB;
}

library TemplateStrategyStorageLib {
    // keccak256("block42.storage.template.strategy.v1");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0x88daa2ea2983d6fbb5b162a7cee941255b0635529ebe8f4d39b6617d0f84ccc7;

    function getStorage()
        internal
        pure
        returns (TemplateStrategyStorage storage ts)
    {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
