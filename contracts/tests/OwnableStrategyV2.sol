// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract OwnableStrategyV2 is
    UUPSUpgradeable,
    StrategyOwnablePausableBaseUpgradeable
{
    // solhint-disable-next-line const-name-snakecase
    string public constant trackingName =
        "brokkr.test_strategy.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "OwnableStrategyV2";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "2.0.0";

    function initialize(StrategyArgs calldata strategyArgs)
        external
        reinitializer(2)
    {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _withdraw(uint256, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _reapReward(NameValuePair[] calldata) internal virtual override {}

    function _getAssetBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {}

    function _getLiabilityBalances()
        internal
        view
        virtual
        override
        returns (Balance[] memory liabilityBalances)
    {}

    function _getAssetValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {}

    function _getLiabilityValuations(bool, bool)
        internal
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}
}
