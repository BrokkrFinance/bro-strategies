//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";

interface IPriceOracle {
    function getPrice(
        IERC20Upgradeable token,
        bool shouldMaximise,
        bool includeAmmPrice
    ) external view returns (uint256);
}
