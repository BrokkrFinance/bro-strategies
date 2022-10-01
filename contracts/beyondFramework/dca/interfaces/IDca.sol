//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IDca {
    function deposit(uint256 amount, uint8 amountSplit) external;

    function withdrawAll() external;

    function withdrawAll(uint256 positionIndex) external;

    function withdrawBluechip() external;

    function withdrawBluechip(uint256 positionIndex) external;

    function depositToken() external view returns (IERC20Upgradeable);
}
