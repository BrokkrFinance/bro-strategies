// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { ITraderJoeRouter } from "../../../dependencies/traderjoe/ITraderJoeRouter.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

library SwapLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum Dex {
        TraderJoeV2
    }

    struct Router {
        Dex dex;
        address router;
    }

    function swapTokensForTokens(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(router.router);

            IERC20Upgradeable(path[0]).safeIncreaseAllowance(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function swapAvaxForTokens(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            amountOut = ITraderJoeRouter(router.router).swapExactAVAXForTokens{
                value: amountIn
            }(
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function swapTokensForAvax(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(router.router);

            IERC20Upgradeable(path[0]).safeIncreaseAllowance(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForAVAX(
                amountIn,
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function getAmountOut(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal view returns (uint256) {
        if (router.dex == Dex.TraderJoeV2) {
            return
                ITraderJoeRouter(router.router).getAmountsOut(amountIn, path)[
                    path.length - 1
                ];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }
}
