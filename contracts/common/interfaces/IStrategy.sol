//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/IFee.sol";
import "../interfaces/IAum.sol";
import "../interfaces/IReward.sol";
import "../interfaces/IInvestable.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IStrategy is IInvestable, IReward {
    struct StrategyArgs {
        IInvestmentToken investmentToken;
        IERC20Upgradeable depositToken;
        uint24 depositFee;
        NameValuePair[] depositFeeParams;
        uint24 withdrawalFee;
        NameValuePair[] withdrawFeeParams;
        uint24 performanceFee;
        NameValuePair[] performanceFeeParams;
        address feeReceiver;
        NameValuePair[] feeReceiverParams;
        uint256 totalInvestmentLimit;
        uint256 investmentLimitPerAddress;
    }
}
