// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IERC20UpgradeableExt } from "../../../interfaces/IERC20UpgradeableExt.sol";

import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import { IUniswapV3Factory } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

library UniswapV3UtilsLib {
    bytes32 internal constant POOL_INIT_CODE_HASH =
        0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

    function computePoolAddress(
        IUniswapV3Factory factory,
        IERC20UpgradeableExt token0,
        IERC20UpgradeableExt token1,
        uint24 fee
    ) internal pure returns (IUniswapV3Pool pool) {
        pool = IUniswapV3Pool(
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                hex"ff",
                                address(factory),
                                keccak256(
                                    abi.encode(
                                        address(token0),
                                        address(token1),
                                        fee
                                    )
                                ),
                                POOL_INIT_CODE_HASH
                            )
                        )
                    )
                )
            )
        );
    }

    function getSqrtPriceX96(IUniswapV3Pool pool)
        internal
        returns (uint160 sqrtPriceX96)
    {
        (sqrtPriceX96, , , , , , ) = pool.slot0();
    }
}
