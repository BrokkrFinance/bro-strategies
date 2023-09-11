// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IERC20UpgradeableExt } from "../../../interfaces/IERC20UpgradeableExt.sol";
import { IPriceOracle } from "../../../interfaces/IPriceOracle.sol";
import { RangeDesc } from "../Common.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

struct UniswapV3Storage {
    IERC20UpgradeableExt token0;
    uint8 token0Decimals;
    IERC20UpgradeableExt token1;
    uint8 token1Decimals;
    uint24 fee;
    IUniswapV3Pool pool;
    RangeDesc[] rangeDescs;
    IPriceOracle priceOracle;
    IERC20UpgradeableExt depositToken;
    uint8 depositTokenDecimals;
}

library UniswapV3StorageLib {
    // keccak256("brokkr.storage.uniswap.v3.strategy");
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant storagePosition =
        0x693d7957c83570400429d3d52b15e56d5ad859891e2407071f7e3c36dad64572;

    function getStorage() internal pure returns (UniswapV3Storage storage ts) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ts.slot := storagePosition
        }
    }
}
