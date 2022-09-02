//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../common/bases/PortfolioOwnablePausableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TestUpgradedPortfolio is
    UUPSUpgradeable,
    PortfolioOwnablePausableBaseUpgradeable
{
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.test_portfolio.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Test portfolio";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "2.0.0";

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
