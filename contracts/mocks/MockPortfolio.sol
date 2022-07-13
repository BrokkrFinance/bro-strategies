//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../common/bases/PortfolioOwnableBaseUpgradeable.sol";

contract MockPortfolio is PortfolioOwnableBaseUpgradeable {
    function initialize(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_
    ) external initializer {
        __PortfolioOwnableBaseUpgradeable_init(investmentToken_, depositToken_);
    }
}
