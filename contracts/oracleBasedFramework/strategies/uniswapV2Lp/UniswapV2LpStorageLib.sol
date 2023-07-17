// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IUniswapV2Pair } from "../../../dependencies/uniswapV2/IUniswapV2Pair.sol";
import { IUniswapV2Router } from "../../../dependencies/uniswapV2/IUniswapV2Router.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

struct UniswapV2LpStorage {
    IUniswapV2Router router;
    IERC20Upgradeable token0;
    IERC20Upgradeable token1;
    IUniswapV2Pair tokenPair;
}

library UniswapV2LpStorageLib {
    // keccak256("brokkr.storage.uniswapv2lp.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0xa099705941672c0912ff186b021b80a7dc95a6861926d3b89351486d7549e318;

    function getStorage()
        internal
        pure
        returns (UniswapV2LpStorage storage ts)
    {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
