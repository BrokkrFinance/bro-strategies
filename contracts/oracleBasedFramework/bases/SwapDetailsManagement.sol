// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { SwapService, SwapServiceProvider } from "../libraries/SwapServiceLib.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

struct SwapDetail {
    SwapService swapService;
    address[] path;
    address[] reversePath;
    bytes data;
}

contract SwapDetailsManagement {
    mapping(IERC20Upgradeable => SwapDetail) public swapDetails;
    address public swapLibAddress;

    function _setSwapDetail(
        IERC20Upgradeable swapFrom,
        SwapServiceProvider swapServiceProvider,
        address router,
        address[] calldata path,
        bytes calldata data
    ) internal {
        uint256 pathLength = path.length;
        address[] memory reversePath = new address[](pathLength);
        for (uint256 i = 0; i < pathLength; i++) {
            reversePath[i] = path[pathLength - 1 - i];
        }

        swapDetails[swapFrom] = SwapDetail(
            SwapService(swapServiceProvider, router),
            path,
            reversePath,
            data
        );
    }

    function _removeSwapDetail(IERC20Upgradeable swapDetailToRemove) internal {
        delete swapDetails[swapDetailToRemove];
    }

    function _setSwapLibAddress(address newSwapLibAddress) internal {
        swapLibAddress = newSwapLibAddress;
    }
}
