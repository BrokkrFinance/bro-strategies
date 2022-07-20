//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Common.sol";
import "../InvestmentToken.sol";
import "../libraries/InvestableLib.sol";
import "./FeeUpgradeable.sol";
import "../interfaces/IStrategy.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

abstract contract StrategyBaseUpgradeable is
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    ContextUpgradeable,
    FeeUpgradeable,
    IStrategy
{
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IInvestmentToken internal investmentToken;
    IERC20Upgradeable internal depositToken;

    // solhint-disable-next-line
    function __StrategyBaseUpgradeable_init(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_,
        uint24 depositFee_,
        uint24 withdrawalFee_,
        uint24 performanceFee_
    ) internal onlyInitializing {
        __ReentrancyGuard_init();
        __ERC165_init();
        __Context_init();
        __FeeOwnableUpgradeable_init(
            depositFee_,
            withdrawalFee_,
            performanceFee_
        );
        investmentToken = investmentToken_;
        depositToken = depositToken_;
    }

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual;

    function deposit(uint256 amount, NameValuePair[] calldata params)
        external
        virtual
        override
        nonReentrant
    {
        if (amount == 0) revert ZeroAmountDeposited();

        depositToken.safeTransferFrom(_msgSender(), address(this), amount);

        uint256 aum = getTotalAUM(true, false);
        uint256 investmentTokenTotalSupply = getInvestmentTokenSupply();
        investmentToken.mint(
            _msgSender(),
            InvestableLib.calculateMintAmount(
                aum,
                amount,
                investmentTokenTotalSupply
            )
        );
        _deposit(amount, params);
        emit Deposit(_msgSender(), amount);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual;

    function withdraw(uint256 amount, NameValuePair[] calldata params)
        external
        virtual
        override
        nonReentrant
    {
        if (amount == 0) revert ZeroAmountWithdrawn();

        investmentToken.burnFrom(_msgSender(), amount);
        uint256 depositTokenBalanceBefore = depositToken.balanceOf(
            address(this)
        );

        _withdraw(amount, params);

        uint256 withdrewAmount = depositToken.balanceOf(address(this)) -
            depositTokenBalanceBefore;
        uint256 feeAmount = (withdrewAmount * withdrawalFee) /
            Math.SHORT_FIXED_DECIMAL_POINTS /
            100;
        currentAccumulatedFee += feeAmount;
        depositToken.safeTransfer(_msgSender(), withdrewAmount - feeAmount);
        emit Withdrawal(_msgSender(), amount);
    }

    function _reapReward(NameValuePair[] calldata params) internal virtual;

    function processReward(
        NameValuePair[] calldata depositParams,
        NameValuePair[] calldata reapRewardParams
    ) external virtual override nonReentrant {
        uint256 depositTokenBalanceBefore = depositToken.balanceOf(
            address(this)
        );

        _reapReward(reapRewardParams);

        uint256 rewardAmount = depositToken.balanceOf(address(this)) -
            depositTokenBalanceBefore;

        if (rewardAmount == 0) revert ZeroAmountAutoCompound();

        _deposit(rewardAmount, depositParams);
        emit Deposit(address(this), rewardAmount);
        emit RewardProcess(rewardAmount);
    }

    function withdrawReward(NameValuePair[] calldata withdrawParams)
        external
        virtual
        override
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IStrategy).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function getDepositToken() external view returns (IERC20Upgradeable) {
        return depositToken;
    }

    function getInvestmentToken() external view returns (IInvestmentToken) {
        return investmentToken;
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

    function getInvestmentTokenSupply()
        public
        view
        virtual
        override
        returns (uint256)
    {
        return investmentToken.totalSupply();
    }

    function getTotalAUM(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (uint256);

    function claimFee() public virtual override nonReentrant {
        uint256 currentAccumulatedFeeCopy = currentAccumulatedFee;
        claimedFee += currentAccumulatedFeeCopy;
        currentAccumulatedFee = 0;
        depositToken.safeTransfer(feeReceiver, currentAccumulatedFeeCopy);
    }
}
