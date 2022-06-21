//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/FeeI.sol";
import "../interfaces/StrategyNativeI.sol";

interface StrategyNativeI is FeeI {
    function deposit(NameValuePair[] memory params) external payable;

    function burn(uint256 amount, NameValuePair[] memory params) external;

    function emergencyBurn(
        uint256 amount,
        address payable recipient,
        NameValuePair[] memory params
    ) external;
}
