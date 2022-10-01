//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDca } from "./IDca.sol";
import { IDcaFor } from "./IDcaFor.sol";
import { IDcaStrategy } from "./IDcaStrategy.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDcaPortfolio is IDca, IDcaFor {
    error TotalAllocationIsNot100();
    error InvalidDepositToken();
    error PortfolioAlreadyWhitelisted();
    error PortfolioNotFound();

    struct DcaPortfolioInitArgs {
        DcaEntry[] strategies;
        IERC20Upgradeable depositToken;
        uint8 investAmountSplit;
    }

    struct DcaEntry {
        IDcaStrategy dca;
        uint8 allocationPercantage; // .00
    }
}
