//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./FreeMoneyProvider.sol";
import "../common/bases/StrategyBaseUpgradeable.sol";
import "../common/InvestmentToken.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MockStrategy is StrategyBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public yieldMultiplier;
    FreeMoneyProvider public freeMoneyProvider;

    function initialize(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_,
        uint24 depositFee_,
        uint24 withdrawalFee_,
        uint24 performanceFee_,
        uint256 yieldMultiplier_,
        FreeMoneyProvider freeMoneyProvider_
    ) external initializer {
        __StrategyBaseUpgradeable_init(
            investmentToken_,
            depositToken_,
            depositFee_,
            withdrawalFee_,
            performanceFee_
        );
        yieldMultiplier = yieldMultiplier_;
        freeMoneyProvider = freeMoneyProvider_;
    }

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual
        override
    {}

    function _withdraw(
        uint256 amount,
        NameValuePair[] calldata /*params*/
    ) internal virtual override {
        freeMoneyProvider.giveMeMoney(amount * 2, depositToken);
    }

    function _reapReward(
        NameValuePair[] calldata /*params*/
    ) internal virtual override {
        freeMoneyProvider.giveMeMoney(10**18, depositToken);
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
        return getInvestmentTokenSupply() * yieldMultiplier;
    }

    function getInvestmentTokenSupply()
        public
        view
        virtual
        override
        returns (uint256)
    {
        return investmentToken.totalSupply();
    }

    function getInvestmentTokenBalanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return investmentToken.balanceOf(account);
    }
}
