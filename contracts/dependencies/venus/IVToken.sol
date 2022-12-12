// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./IComptroller.sol";

interface IVToken {
    function borrowBalanceCurrent(address account) external returns (uint256);

    function comptroller() external returns (IComptroller);
}
