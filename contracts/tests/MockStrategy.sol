//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./FreeMoneyProvider.sol";
import "../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../common/InvestmentToken.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MockStrategy is
    UUPSUpgradeable,
    StrategyOwnablePausableBaseUpgradeable
{
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "block42.mock_strategy.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Mock strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public yieldMultiplier;
    FreeMoneyProvider public freeMoneyProvider;
    uint256[] public x;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        uint256 yieldMultiplier_,
        FreeMoneyProvider freeMoneyProvider_
    ) external initializer {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);
        yieldMultiplier = yieldMultiplier_;
        freeMoneyProvider = freeMoneyProvider_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {}

    function _withdraw(
        uint256 amount,
        NameValuePair[] calldata /*params*/
    ) internal virtual override {
        freeMoneyProvider.giveMeMoney(amount * yieldMultiplier, depositToken);
    }

    function _reapReward(
        NameValuePair[] calldata /*params*/
    ) internal virtual override {
        freeMoneyProvider.giveMeMoney(10**18, depositToken);
    }

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

    function getAssetValuations(
        bool, /*shouldMaximise*/
        bool /*shouldIncludeAmmPrice*/
    )
        public
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {}

    function getLiabilityValuations(
        bool, /*shouldMaximise*/
        bool /*shouldIncludeAmmPrice*/
    )
        public
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}

    function getEquityValuation(
        bool, /*shouldMaximise*/
        bool /*shouldIncludeAmmPrice*/
    ) public view virtual override returns (uint256) {
        return getInvestmentTokenSupply() * yieldMultiplier;
    }
}
