//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./TemplateStrategyStorageLib.sol";
import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../common/InvestmentToken.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract TemplateStrategy is StrategyOwnablePausableBaseUpgradeable {
    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "block42.template_strategy.<insert git label here>";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "Template strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    using SafeERC20Upgradeable for IInvestmentToken;

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

    function _deposit(
        uint256, /* amount */
        NameValuePair[] calldata /* params */
    ) internal virtual override {
        TemplateStrategyStorage
            storage strategyStorage = TemplateStrategyStorageLib.getStorage();
        strategyStorage.dataA = "this is just an example of using the storage";
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {}

    function _reapReward(NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        // contains the interaction with DEFI protocols to reap the rewards
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
}
