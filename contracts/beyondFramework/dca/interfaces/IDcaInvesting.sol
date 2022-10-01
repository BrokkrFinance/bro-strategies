//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IDcaInvesting {
    function exchangeDepositsAndInvestRewards() external;

    function canInvest() external view returns (bool);
}
