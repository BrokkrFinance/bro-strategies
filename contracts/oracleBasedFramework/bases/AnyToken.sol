// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { NameValuePair } from "../Common.sol";
import { SwapServiceLib } from "../libraries/SwapServiceLib.sol";
import { SwapDetailsManagement, SwapDetail } from "./SwapDetailsManagement.sol";
import { IAnyToken } from "../interfaces/IAnyToken.sol";
import { IInvestable } from "../interfaces/IInvestable.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

abstract contract AnyToken is IAnyToken, SwapDetailsManagement {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function _depositAnyToken(
        IERC20Upgradeable convertableToken,
        uint256 convertableTokenAmountIn,
        NameValuePair[] calldata,
        address msgSender,
        IERC20Upgradeable depositToken
    ) internal returns (uint256) {
        // transferring tokens from sender to this contract
        convertableToken.safeTransferFrom(
            msgSender,
            address(this),
            convertableTokenAmountIn
        );

        if (depositToken == convertableToken) {
            return convertableTokenAmountIn;
        } else {
            // calling the swap library
            SwapDetail storage swapDetail = swapDetails[convertableToken];
            return
                SwapServiceLib.swapExactTokensForTokensExtWrapper(
                    swapLibAddress,
                    swapDetail.swapService,
                    convertableTokenAmountIn,
                    0,
                    swapDetail.path,
                    swapDetail.data
                );
        }
    }

    function _withdrawAnyToken(
        IERC20Upgradeable convertableToken,
        uint256 depositTokenAmountOut,
        NameValuePair[] calldata,
        address msgSender,
        IERC20Upgradeable depositToken
    ) internal {
        SwapDetail storage swapDetail = swapDetails[convertableToken];

        convertableToken.safeTransfer(
            msgSender,
            (depositToken == convertableToken)
                ? depositTokenAmountOut
                : SwapServiceLib.swapExactTokensForTokensExtWrapper(
                    swapLibAddress,
                    swapDetail.swapService,
                    depositTokenAmountOut,
                    0,
                    swapDetail.reversePath,
                    swapDetail.data
                )
        );
    }
}
