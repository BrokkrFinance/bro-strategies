// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IUniswapV2LikeRouter } from "../../dependencies/swap/IUniswapV2LikeRouter.sol";
import { IUniswapV2Pair } from "../../dependencies/swap/IUniswapV2Pair.sol";
import { ITraderJoeLBRouter } from "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

enum Dex {
    UniswapV2,
    TraderJoeV2,
    TraderJoeV2dot1,
    UniswapV3,
    Camelot
}

library SwapProviderLibrary {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function swapTokensForTokens(
        address swapServiceProvider,
        Dex dex,
        address router,
        uint256 amountIn,
        address[] memory path,
        bytes memory data
    ) internal returns (uint256 amountOut) {
        amountOut = abi.decode(
            Address.functionDelegateCall(
                swapServiceProvider,
                abi.encodeWithSignature(
                    "swapTokensForTokensExt(Dex,address,uint256,address[],bytes)",
                    dex,
                    router,
                    amountIn,
                    path,
                    data
                )
            ),
            (uint256)
        );
    }

    function getPoolInfo(
        Dex dex,
        address lbPair,
        address tokenFirst
    )
        internal
        returns (
            uint256 reserve0,
            uint256 reserve1,
            uint256 lpSupply
        )
    {
        if (dex == Dex.UniswapV2) {
            IUniswapV2Pair uniswapV2LbPair = IUniswapV2Pair(lbPair);
            (reserve0, reserve1, ) = uniswapV2LbPair.getReserves();
            if (tokenFirst != uniswapV2LbPair.token0())
                (reserve1, reserve0) = (reserve0, reserve1);

            lpSupply = uniswapV2LbPair.totalSupply();
        }
    }

    function swapTokensForTokensExt(
        Dex dex,
        address router,
        uint256 amountIn,
        address[] calldata path,
        bytes memory data
    ) external returns (uint256 amountOut) {
        IERC20Upgradeable(path[0]).safeIncreaseAllowance(router, amountIn);

        if (dex == Dex.UniswapV2) {
            IUniswapV2LikeRouter routerUniswapV2Like = IUniswapV2LikeRouter(
                router
            );

            amountOut = routerUniswapV2Like.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                address(this),
                block.timestamp
            )[path.length - 1];
        } else if (dex == Dex.UniswapV3) {
            ISwapRouter routerUniswapV3 = ISwapRouter(router);

            uint256[] memory fees = abi.decode(data, (uint256[]));
            amountOut = routerUniswapV3.exactInput(
                ISwapRouter.ExactInputParams({
                    path: createSwapPath(path, fees),
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0
                })
            );
            // } else if (router.dex == Dex.TraderJoeV2) {
            //     ITraderJoeLBRouter traderjoeLBRouter = ITraderJoeLBRouter(
            //         router.router
            //     );

            //     amountOut = traderjoeLBRouter.swapExactTokensForTokens(
            //         amountIn,
            //         0,
            //         binSteps,
            //         path,
            //         address(this),
            //         block.timestamp
            //     );
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function createSwapPath(address[] memory path, uint256[] memory fees)
        private
        pure
        returns (bytes memory pathEncoded)
    {
        pathEncoded = abi.encodePacked(path[0]);
        for (uint256 i = 0; i < fees.length; i++) {
            uint24 fee = uint24(fees[i]);
            pathEncoded = abi.encodePacked(pathEncoded, fee, path[i + 1]);
        }
    }

    // function getAmountOut(
    //     Router memory router,
    //     uint256 amountIn,
    //     address[] memory path
    // ) internal view returns (uint256) {
    //     if (router.dex == Dex.UniswapV2) {
    //         return
    //             IUniswapV2LikeRouter(router.router).getAmountsOut(
    //                 amountIn,
    //                 path
    //             )[path.length - 1];
    //     } else {
    //         // solhint-disable-next-line reason-string
    //         revert("SwapLib: Invalid swap service provider");
    //     }
    // }
}
