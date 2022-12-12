// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./Math.sol";

import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "../../dependencies/pancakeswap/IPancakeRouter01.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

error InvalidSwapServiceProvider();

enum SwapServiceProvider {
    AvalancheTraderJoeV2,
    BscPancakeSwap
}

struct SwapService {
    SwapServiceProvider provider;
    address router;
}

library SwapServiceLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function swapExactTokensForTokens(
        SwapService memory swapService,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (swapService.provider == SwapServiceProvider.AvalancheTraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(
                swapService.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            revert InvalidSwapServiceProvider();
        }
    }

    function swapExactTokensForNative(
        SwapService memory swapService,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (swapService.provider == SwapServiceProvider.BscPancakeSwap) {
            IPancakeRouter01 pancakeRouter = IPancakeRouter01(
                swapService.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(pancakeRouter),
                amountIn
            );

            amountOut = pancakeRouter.swapExactTokensForETH(
                amountIn,
                minAmountOut,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            revert InvalidSwapServiceProvider();
        }
    }

    function swapTokensForExactTokens(
        SwapService memory swapService,
        uint256 amountOut,
        uint256 maxAmountIn,
        address[] memory path
    ) internal returns (uint256 amountIn) {
        if (swapService.provider == SwapServiceProvider.AvalancheTraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(
                swapService.router
            );

            uint256[] memory maxAmountInCalculated = traderjoeRouter
                .getAmountsIn(amountOut, path);

            uint256 maxAmountInFinal = Math.min(
                maxAmountInCalculated[0],
                maxAmountIn
            );
            IERC20Upgradeable(path[0]).approve(
                address(traderjoeRouter),
                maxAmountInFinal
            );

            amountIn = traderjoeRouter.swapTokensForExactTokens(
                amountOut,
                maxAmountInFinal,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[0];
        } else {
            revert InvalidSwapServiceProvider();
        }
    }

    function swapTokensForExactNative(
        SwapService memory swapService,
        uint256 amountOut,
        uint256 maxAmountIn,
        address[] memory path
    ) internal returns (uint256 amountIn) {
        if (swapService.provider == SwapServiceProvider.BscPancakeSwap) {
            IPancakeRouter01 pancakeRouter = IPancakeRouter01(
                swapService.router
            );

            uint256[] memory maxAmountInCalculated = pancakeRouter.getAmountsIn(
                amountOut,
                path
            );

            uint256 maxAmountInFinal = Math.min(
                maxAmountInCalculated[0],
                maxAmountIn
            );
            IERC20Upgradeable(path[0]).approve(
                address(pancakeRouter),
                maxAmountInFinal
            );

            amountIn = pancakeRouter.swapTokensForExactETH(
                amountOut,
                maxAmountInFinal,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[0];
        } else {
            revert InvalidSwapServiceProvider();
        }
    }
}
