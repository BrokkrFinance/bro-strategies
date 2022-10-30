//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDca } from "./IDca.sol";
import { IDcaFor } from "./IDcaFor.sol";
import { IDcaInvesting } from "./IDcaInvesting.sol";
import { SwapLib } from "../libraries/SwapLib.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDcaStrategy is IDca, IDcaFor, IDcaInvesting {
    error ZeroDeposit();
    error PositionsLimitReached();
    error NothingToInvest();
    error NothingToWithdraw();
    error PortfolioAlreadyWhitelisted();
    error PortfolioNotFound();

    // TODO: declare events

    struct DcaStrategyInitArgs {
        DepositFee depositFee;
        address dcaInvestor;
        TokenInfo depositTokenInfo;
        uint256 investmentPeriod;
        uint256 lastInvestmentTimestamp;
        uint16 positionsLimit;
        SwapLib.Router router;
        address[] depositToBluechipSwapPath;
        address[] bluechipToDepositSwapPath;
    }

    struct DepositFee {
        address feeReceiver;
        uint8 fee; // .00 number
    }

    struct TokenInfo {
        IERC20Upgradeable token;
        uint8 decimals;
    }

    struct Position {
        uint256 depositAmount;
        uint8 amountSplit;
        uint256 investedAt;
        uint256 investedAtHistoricalIndex;
    }

    struct DcaDepositor {
        Position[] positions;
    }

    enum BluechipInvestmentState {
        Investing,
        Withdrawn,
        EmergencyExited
    }

    function depositorInfo(address depositor)
        external
        view
        returns (DcaDepositor memory);

    function isEmergencyExited() external view returns (bool);
}
