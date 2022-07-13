//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IFee {
    error InvalidFeeError();

    event DepositFeeChange(uint256 fee);
    event WithdrawalFeeChange(uint256 fee);
    event PerformanceFeeChange(uint256 fee);
    event FeeReceiverChange(address feeReceiver);
    event FeeClaim(uint256 fee);

    function getDepositFee() external returns (uint24);

    function setDepositFee(uint24 fee) external;

    function getWithdrawalFee() external returns (uint24);

    function setWithdrawalFee(uint24 fee) external;

    function getPerformanceFee() external returns (uint24);

    function setPerformanceFee(uint24 fee) external;

    function setFeeReceiver(address feeReceiver) external;

    function claimFee() external;
}
