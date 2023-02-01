// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../../common/interfaces/IPriceOracle.sol";
import "../../common/libraries/SwapServiceLib.sol";
import "../../dependencies/venus/IVBNB.sol";
import "../../dependencies/venus/IVBep20.sol";
import "../../dependencies/pancakeswap/IPancakeRouter01.sol";
import "../../dependencies/pancakeswap/IPancakePair.sol";
import "../../dependencies/pancakeswap/IPancakeMasterChefV2.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

struct DnsCakeStorage {
    uint256 safetyFactor;
    IERC20Upgradeable venusSupplyToken;
    IVBep20 venusSupplyMarket;
    IERC20Upgradeable ammPairDepositToken;
    IPancakePair swapPair; // could be obtained from the factory
    IPancakeRouter01 router;
    IPancakeMasterChefV2 masterChef;
    uint256 farmId;
    // The following variables are stored both in the storage and the base class,
    // so the functions in the faucets don't need to take extra parameters.
    // The following variables are expected to change very rarely.
    IPriceOracle priceOracle;
    SwapService swapService;
    IERC20Upgradeable depositToken;
}

library DnsCakeStorageLib {
    // keccak256("brokkr.storage.dns.cake.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0xd3828efc58a8eb190211d906b54a549f74f6d6d5cf47ab30819388e7f1a03b77;

    function getStorage() internal pure returns (DnsCakeStorage storage ts) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
