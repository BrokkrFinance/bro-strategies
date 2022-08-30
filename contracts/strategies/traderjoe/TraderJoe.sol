//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(StrategyArgs calldata strategyArgs)
        external
        initializer
    {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _withdraw(uint256 amount, NameValuePair[] calldata)
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

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
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
