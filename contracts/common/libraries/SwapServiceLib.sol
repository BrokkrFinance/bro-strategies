// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./Math.sol";

import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

error InvalidSwapServiceProvider();

enum SwapServiceProvider {
    TraderJoe
}

struct SwapService {
    SwapServiceProvider provider;
    address router;
}

library SwapServiceLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function swapExactTokensForTokens(
        SwapService memory swapService_,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (swapService_.provider == SwapServiceProvider.TraderJoe) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(
                swapService_.router
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

    function swapTokensForExactTokens(
        SwapService memory swapService_,
        uint256 amountOut,
        uint256 maxAmountIn,
        address[] memory path
    ) internal returns (uint256 amountIn) {
        if (swapService_.provider == SwapServiceProvider.TraderJoe) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(
                swapService_.router
            );

            uint256[] memory maxAmountInCalculated = traderjoeRouter
                .getAmountsIn(amountOut, path);

            IERC20Upgradeable(path[0]).approve(
                address(traderjoeRouter),
                Math.min(maxAmountInCalculated[0], maxAmountIn)
            );

            amountIn = traderjoeRouter.swapTokensForExactTokens(
                amountOut,
                maxAmountIn,
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
