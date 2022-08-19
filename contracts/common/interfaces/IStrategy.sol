//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../interfaces/IFee.sol";
import "../interfaces/IAum.sol";
import "../interfaces/IReward.sol";
import "../interfaces/IInvestable.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IStrategy is IInvestable, IReward {}
