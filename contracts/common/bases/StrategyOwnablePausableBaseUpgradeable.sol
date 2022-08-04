//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./StrategyOwnableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

abstract contract StrategyOwnablePausableBaseUpgradeable is
    StrategyOwnableBaseUpgradeable,
    PausableUpgradeable
{
    uint256[4] private futureFeaturesGap;

    // solhint-disable-next-line
    function __StrategyOwnablePausableBaseUpgradeable_init(
        StrategyArgs calldata strategyArgs
    ) internal onlyInitializing {
        __StrategyOwnableBaseUpgradeable_init(strategyArgs);
        __Pausable_init();
    }

    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }

    function deposit(
        uint256 amount,
        address investableTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override whenNotPaused {
        super.deposit(amount, investableTokenReceiver, params);
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
