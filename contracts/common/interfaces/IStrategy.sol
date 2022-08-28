//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/IReward.sol";
import "../interfaces/IInvestable.sol";

interface IStrategy is IInvestable, IReward {}
