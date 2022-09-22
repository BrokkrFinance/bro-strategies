// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../common/bases/PortfolioOwnableBaseUpgradeable.sol";

contract MockPortfolio is PortfolioOwnableBaseUpgradeable {
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.mock_portfolio.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Mock portfolio";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    function initialize(PortfolioArgs calldata portfolioArgs)
        external
        initializer
    {
        __PortfolioOwnableBaseUpgradeable_init(portfolioArgs);
    }
}
