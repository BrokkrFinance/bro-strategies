// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library Errors {
    // IndexStrategyUpgradeable errors.
    error Index_NotWhitelistedToken(address token);
    error Index_ExceedEquityValuationLimit();
    error Index_AboveMaxAmount();
    error Index_BelowMinAmount();
    error Index_ZeroAddress();
    error Index_WrongSwapAmount();

    // SwapAdapter errors.
    error SwapAdapter_WrongDEX();
    error SwapAdapter_WrongPair();

    // IndexOracle errors.
    error Oracle_TokenNotSupported(address token);
}
