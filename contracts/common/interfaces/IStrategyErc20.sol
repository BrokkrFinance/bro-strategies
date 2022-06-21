//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/IFee.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IStrategyErc20 is IFee {
    function depositErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external;

    function burnErc20(
        uint256 amount,
        IERC20 token,
        NameValuePair[] memory params
    ) external;

    function emergencyBurnErc20(
        uint256 amount,
        IERC20 token,
        address payable recipient,
        NameValuePair[] memory params
    ) external;
}
