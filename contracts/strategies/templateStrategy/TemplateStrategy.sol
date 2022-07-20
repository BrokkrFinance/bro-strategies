//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyOwnableBaseUpgradeable.sol";
import "../../common/InvestmentToken.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract TemplateStrategy is StrategyOwnableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_,
        uint24 depositFee_,
        uint24 withdrawalFee_,
        uint24 performanceFee_
    ) external initializer {
        __StrategyOwnableBaseUpgradeable_init(
            investmentToken_,
            depositToken_,
            depositFee_,
            withdrawalFee_,
            performanceFee_
        );
    }

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

    function _reapReward(NameValuePair[] calldata params)
        internal
        virtual
        override
    {
        // contains the interaction with DEFI protocols to reap the rewards
    }

    function getAssets()
        external
        view
        virtual
        override
        returns (Asset[] memory)
    {
        Asset[] memory res;
        return res;
    }

    function getTotalAUM(
        bool, /*shouldMaximise*/
        bool /*shouldIncludeAmmPrice*/
    ) public view virtual override returns (uint256) {
        return 0;
    }
}
