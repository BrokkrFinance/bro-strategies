// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./Math.sol";

import "../../dependencies/swap/IUniswapV2LikeRouter.sol";
import "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

error InvalidSwapServiceProvider();

enum SwapServiceProvider {
    TraderJoe,
    TraderJoeV2,
    Pangolin
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
        address[] memory path,
        uint256[] memory binSteps
    ) internal returns (uint256 amountOut) {
        if (
            swapService_.provider == SwapServiceProvider.TraderJoe ||
            swapService_.provider == SwapServiceProvider.Pangolin
        ) {
            IUniswapV2LikeRouter uniswapV2LikeRouter = IUniswapV2LikeRouter(
                swapService_.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(uniswapV2LikeRouter),
                amountIn
            );

            amountOut = uniswapV2LikeRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else if (swapService_.provider == SwapServiceProvider.TraderJoeV2) {
            ITraderJoeLBRouter traderjoeLBRouter = ITraderJoeLBRouter(
                swapService_.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(traderjoeLBRouter),
                amountIn
            );

            amountOut = traderjoeLBRouter.swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                binSteps,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            );
        } else {
            revert InvalidSwapServiceProvider();
        }
    }

    function swapTokensForExactTokens(
        SwapService memory swapService_,
        uint256 amountOut,
        uint256 maxAmountIn,
        address[] memory path,
        uint256[] memory binSteps
    ) internal returns (uint256 amountIn) {
        if (
            swapService_.provider == SwapServiceProvider.TraderJoe ||
            swapService_.provider == SwapServiceProvider.Pangolin
        ) {
            IUniswapV2LikeRouter uniswapV2LikeRouter = IUniswapV2LikeRouter(
                swapService_.router
            );

            uint256[] memory maxAmountInCalculated = uniswapV2LikeRouter
                .getAmountsIn(amountOut, path);

            IERC20Upgradeable(path[0]).approve(
                address(uniswapV2LikeRouter),
                Math.min(maxAmountInCalculated[0], maxAmountIn)
            );

            amountIn = uniswapV2LikeRouter.swapTokensForExactTokens(
                amountOut,
                maxAmountIn,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[0];
        } else if (swapService_.provider == SwapServiceProvider.TraderJoeV2) {
            ITraderJoeLBRouter traderjoeLBRouter = ITraderJoeLBRouter(
                swapService_.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(traderjoeLBRouter),
                maxAmountIn
            );

            amountIn = traderjoeLBRouter.swapTokensForExactTokens(
                amountOut,
                maxAmountIn,
                binSteps,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[0];

            IERC20Upgradeable(path[0]).approve(address(traderjoeLBRouter), 0);
        } else {
            revert InvalidSwapServiceProvider();
        }
    }
}
