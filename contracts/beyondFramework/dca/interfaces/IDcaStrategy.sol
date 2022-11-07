//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDca } from "./IDca.sol";
import { IDcaFor } from "./IDcaFor.sol";
import { IDcaInvesting } from "./IDcaInvesting.sol";
import { SwapLib } from "../libraries/SwapLib.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDcaStrategy is IDca, IDcaFor, IDcaInvesting {
    error TooSmallDeposit();
    error PositionsLimitReached();
    error NothingToInvest();
    error NothingToWithdraw();
    error PortfolioAlreadyWhitelisted();
    error PortfolioNotFound();

    event Deposit(address indexed sender, uint256 amount, uint256 amountSplit);
    event Invest(
        uint256 depositAmountSpent,
        uint256 bluechipReceived,
        uint256 investedAt
    );
    event Withdraw(
        address indexed sender,
        uint256 withdrawnDeposit,
        uint256 withdrawnBluechip
    );
    event StatusChanged(
        BluechipInvestmentState indexed prevStatus,
        BluechipInvestmentState indexed newStatus
    );
    event PortfolioAdded(address indexed newPortfolio);
    event PortfolioRemoved(address indexed removedPortfolio);

    struct DcaStrategyInitArgs {
        DepositFee depositFee;
        address dcaInvestor;
        TokenInfo depositTokenInfo;
        uint256 investmentPeriod;
        uint256 lastInvestmentTimestamp;
        uint256 minDepositAmount;
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

    function depositTokenBalance() external view returns (uint256);

    function bluechipTokenBalance() external view returns (uint256);

    function minDepositAmount() external view returns (uint256);

    function getInvestAmountAt(uint8 index) external view returns (uint256);

    function currentInvestQueueIndext() external view returns (uint8);

    function getHistoricalGaugeAt(uint256 index)
        external
        view
        returns (uint256, uint256);

    function currentDcaHistoryIndex() external view returns (uint256);
}
