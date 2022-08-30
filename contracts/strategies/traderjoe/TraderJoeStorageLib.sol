//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../dependencies/traderjoe/ITraderJoeMasterChef.sol";
import "../../dependencies/traderjoe/ITraderJoePair.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

struct TraderJoeStorage {
    ITraderJoeRouter router;
    ITraderJoeMasterChef masterChef;
    IERC20Upgradeable pairDepositToken;
    ITraderJoePair lpToken;
    IERC20Upgradeable joeToken;
    uint256 farmId;
}

library TraderJoeStorageLib {
    // keccak256("brokkr.storage.traderjoe.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0x2c18a668c6ed16d1abb08a50aa4bef7a42b8953231af749500b07f3b5a121f25;

    function getStorage() internal pure returns (TraderJoeStorage storage ts) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
