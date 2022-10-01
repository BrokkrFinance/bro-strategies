//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDca } from "./IDca.sol";
import { IDcaFor } from "./IDcaFor.sol";
import { IDcaInvesting } from "./IDcaInvesting.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDcaStrategy is IDca, IDcaFor, IDcaInvesting {
    error ZeroDeposit();
    error PositionsLimitReached();
    error NothingToInvest();
    error NothingToWithdraw();
    error PortfolioAlreadyWhitelisted();
    error PortfolioNotFound();

    struct DcaStrategyInitArgs {
        address dcaInvestor;
        IERC20Upgradeable depositToken;
        uint256 investmentPeriod;
        uint256 lastInvestmentTimestamp;
        uint16 positionsLimit;
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
}
