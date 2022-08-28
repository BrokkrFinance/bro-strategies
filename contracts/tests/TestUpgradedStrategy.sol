//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";

contract TestUpgradedStrategy is StrategyOwnablePausableBaseUpgradeable {
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.test_strategy.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Test Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "2.0.0";

    function initialize(StrategyArgs calldata strategyArgs)
        external
        reinitializer(2)
    {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);
    }

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

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {}

    function getLiabilityBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory liabilityBalances)
    {}

    function getAssetValuations(bool, bool)
        public
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {}

    function getLiabilityValuations(bool, bool)
        public
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}
}
