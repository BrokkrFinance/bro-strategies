// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../../common/bases/PortfolioOwnablePausableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PercentageAllocation is
    UUPSUpgradeable,
    PortfolioOwnablePausableBaseUpgradeable
{
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.percentage_allocation_portfolio.percentage_allocation_portfolio_v1.0.1";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName =
        "Percentage allocation portfolio";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.1";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(PortfolioArgs calldata portfolioArgs)
        external
        reinitializer(2)
    {
        __PortfolioOwnablePausableBaseUpgradeable_init(portfolioArgs);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
