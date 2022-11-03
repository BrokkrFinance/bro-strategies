//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IDca } from "./IDca.sol";
import { IDcaFor } from "./IDcaFor.sol";
import { IDcaStrategy } from "./IDcaStrategy.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDcaPortfolio is IDca, IDcaFor {
    error InvalidDcaInvestStatus();
    error InvalidDepositToken();
    error PortfolioAlreadyWhitelisted();
    error PortfolioNotFound();
    error DcaAlreadyAdded();
    error DcaNotFound();

    struct DcaPortfolioInitArgs {
        IDcaStrategy[] strategies;
        IERC20Upgradeable depositToken;
        uint8 investAmountSplit;
    }
}
