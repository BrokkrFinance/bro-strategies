// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./StrategyRoleableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

abstract contract StrategyRoleablePausableBaseUpgradeable is
    PausableUpgradeable,
    StrategyRoleableBaseUpgradeable
{
    uint256[4] private futureFeaturesGap;

    // solhint-disable-next-line
    function __StrategyRoleablePausableBaseUpgradeable_init(
        StrategyArgs calldata strategyArgs
    ) internal onlyInitializing {
        __Pausable_init();
        __StrategyRoleableBaseUpgradeable_init(strategyArgs);
    }

    function pause() external onlyRole(PAUSE_ROLE) {
        super._pause();
    }

    function unpause() external onlyRole(PAUSE_ROLE) {
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

    function withdrawReward(NameValuePair[] calldata withdrawParams)
        public
        virtual
        override
        whenNotPaused
    {
        super.withdrawReward(withdrawParams);
    }
}
