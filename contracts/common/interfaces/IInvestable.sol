//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "../Common.sol";
import "./IAUM.sol";
import "./IFee.sol";
import "./IInvestmentToken.sol";

interface IInvestable is IAUM, IFee {
    error ZeroAmountDeposited();
    error ZeroAmountWithdrawn();

    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed withdrawer, uint256 amount);

    function deposit(uint256 amount, NameValuePair[] calldata params) external;

    function withdraw(uint256 amount, NameValuePair[] calldata params) external;

    function getDepositToken() external view returns (IERC20Upgradeable);

    function getInvestmentToken() external view returns (IInvestmentToken);
}
