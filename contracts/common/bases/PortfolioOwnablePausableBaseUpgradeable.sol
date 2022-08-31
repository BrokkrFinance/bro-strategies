//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./PortfolioOwnableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

abstract contract PortfolioOwnablePausableBaseUpgradeable is
    PausableUpgradeable,
    PortfolioOwnableBaseUpgradeable
{
    uint256[4] private futureFeaturesGap;

    // solhint-disable-next-line
    function __PortfolioOwnablePausableBaseUpgradeable_init(
        PortfolioArgs calldata portfolioArgs
    ) internal onlyInitializing {
        __Pausable_init();
        __PortfolioOwnableBaseUpgradeable_init(portfolioArgs);
    }

    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }

    function deposit(
        uint256 amount,
        address investmentTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override whenNotPaused {
        super.deposit(amount, investmentTokenReceiver, params);
    }

    function withdraw(
        uint256 amount,
        address depositTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override whenNotPaused {
        super.withdraw(amount, depositTokenReceiver, params);
    }
}
