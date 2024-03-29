// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

interface INATIVE {
    function deposit() external payable;

    function withdraw(uint256 _amount) external;
}
