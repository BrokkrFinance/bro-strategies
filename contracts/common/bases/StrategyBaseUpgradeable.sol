// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./FeeUpgradeable.sol";
import "./InvestmentLimitUpgradeable.sol";
import "../interfaces/IInvestmentToken.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/IStrategy.sol";
import "../libraries/InvestableLib.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

struct StrategyArgs {
    IInvestmentToken investmentToken;
    IERC20Upgradeable depositToken;
    uint24 depositFee;
    NameValuePair[] depositFeeParams;
    uint24 withdrawalFee;
    NameValuePair[] withdrawFeeParams;
    uint24 performanceFee;
    NameValuePair[] performanceFeeParams;
    address feeReceiver;
    NameValuePair[] feeReceiverParams;
    uint256 totalInvestmentLimit;
    uint256 investmentLimitPerAddress;
    IPriceOracle priceOracle;
    uint8 swapServiceProvider;
    address swapServiceRouter;
}

abstract contract StrategyBaseUpgradeable is
    ContextUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    FeeUpgradeable,
    InvestmentLimitUpgradeable,
    IStrategy
{
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidSwapServiceProvider();

    enum SwapServiceProvider {
        TraderJoe
    }

    struct SwapService {
        SwapServiceProvider provider;
        address router;
    }

    IInvestmentToken internal investmentToken;
    IERC20Upgradeable internal depositToken;
    IPriceOracle public priceOracle;
    SwapService public swapService;
    uint256[8] private futureFeaturesGap;

    // solhint-disable-next-line
    function __StrategyBaseUpgradeable_init(StrategyArgs calldata strategyArgs)
        internal
        onlyInitializing
    {
        __Context_init();
        __ReentrancyGuard_init();
        __ERC165_init();
        __FeeUpgradeable_init(
            strategyArgs.depositFee,
            strategyArgs.depositFeeParams,
            strategyArgs.withdrawalFee,
            strategyArgs.withdrawFeeParams,
            strategyArgs.performanceFee,
            strategyArgs.performanceFeeParams,
            strategyArgs.feeReceiver,
            strategyArgs.feeReceiverParams
        );
        __InvestmentLimitUpgradeable_init(
            strategyArgs.totalInvestmentLimit,
            strategyArgs.investmentLimitPerAddress
        );
        investmentToken = strategyArgs.investmentToken;
        depositToken = strategyArgs.depositToken;
        setPriceOracle(strategyArgs.priceOracle);
        setSwapService(
            SwapServiceProvider(strategyArgs.swapServiceProvider),
            strategyArgs.swapServiceRouter
        );
    }

    function _deposit(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual;

    function deposit(
        uint256 amount,
        address investmentTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override nonReentrant {
        if (amount == 0) revert ZeroAmountDeposited();

        // check investment limits
        uint256 totalEquity;
        uint256 userEquity;
        uint256 investmentTokenSupply = getInvestmentTokenSupply();
        if (investmentTokenSupply != 0) {
            totalEquity = getEquityValuation(true, false);

            uint256 investmentTokenBalance = getInvestmentTokenBalanceOf(
                investmentTokenReceiver
            );
            userEquity =
                (totalEquity * investmentTokenBalance) /
                investmentTokenSupply;
        }
        checkTotalInvestmentLimit(amount, totalEquity);
        checkInvestmentLimitPerAddress(amount, userEquity);

        depositToken.safeTransferFrom(_msgSender(), address(this), amount);

        uint256 equity = getEquityValuation(true, false);
        uint256 investmentTokenTotalSupply = getInvestmentTokenSupply();
        investmentToken.mint(
            investmentTokenReceiver,
            InvestableLib.calculateMintAmount(
                equity,
                amount,
                investmentTokenTotalSupply
            )
        );
        _deposit(amount, params);
        emit Deposit(_msgSender(), investmentTokenReceiver, amount);
    }

    function _beforeWithdraw(
        uint256, /*amount*/
        NameValuePair[] calldata /*params*/
    ) internal virtual returns (uint256) {
        return depositToken.balanceOf(address(this));
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata params)
        internal
        virtual;

    function _afterWithdraw(
        uint256, /*amount*/
        NameValuePair[] calldata /*params*/
    ) internal virtual returns (uint256) {
        return depositToken.balanceOf(address(this));
    }

    function withdraw(
        uint256 amount,
        address depositTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override nonReentrant {
        if (amount == 0) revert ZeroAmountWithdrawn();

        uint256 depositTokenBalanceBefore = _beforeWithdraw(amount, params);
        _withdraw(amount, params);
        uint256 withdrewAmount = _afterWithdraw(amount, params) -
            depositTokenBalanceBefore;
        uint256 feeAmount = (withdrewAmount * getWithdrawalFee(params)) /
            Math.SHORT_FIXED_DECIMAL_FACTOR /
            100;

        investmentToken.burnFrom(_msgSender(), amount);
        setCurrentAccumulatedFee(getCurrentAccumulatedFee() + feeAmount);
        depositToken.safeTransfer(
            depositTokenReceiver,
            withdrewAmount - feeAmount
        );
        emit Withdrawal(_msgSender(), depositTokenReceiver, amount);
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

        emit RewardProcess(rewardAmount);

        if (rewardAmount == 0) return;

        _deposit(rewardAmount, depositParams);
        emit Deposit(address(this), address(0), rewardAmount);
    }

    function withdrawReward(NameValuePair[] calldata withdrawParams)
        public
        virtual
        override
    {}

    function setPriceOracle(IPriceOracle priceOracle_) public virtual {
        priceOracle = priceOracle_;
    }

    function setSwapService(SwapServiceProvider provider, address router)
        public
        virtual
    {
        swapService = SwapService(provider, router);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IAum).interfaceId ||
            interfaceId == type(IFee).interfaceId ||
            interfaceId == type(IInvestable).interfaceId ||
            interfaceId == type(IReward).interfaceId ||
            interfaceId == type(IStrategy).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (Valuation[] memory);

    function getLiabilityValuations(
        bool shouldMaximise,
        bool shouldIncludeAmmPrice
    ) public view virtual override returns (Valuation[] memory);

    function getEquityValuation(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (uint256)
    {
        uint256 equityValuation;

        Valuation[] memory assetValuations = getAssetValuations(
            shouldMaximise,
            shouldIncludeAmmPrice
        );
        uint256 assetValuationsLength = assetValuations.length;
        for (uint256 i = 0; i < assetValuationsLength; i++)
            equityValuation += assetValuations[i].valuation;

        Valuation[] memory liabilityValuations = getLiabilityValuations(
            shouldMaximise,
            shouldIncludeAmmPrice
        );
        uint256 liabilityValuationsLength = liabilityValuations.length;
        // negative equity should never occur, but if it does, it is safer to fail here, by underflow
        // versus returning a signed integer that is possibly negative and forgetting to handle it on the call side
        for (uint256 i = 0; i < liabilityValuationsLength; i++)
            equityValuation -= liabilityValuations[i].valuation;

        return equityValuation;
    }

    function claimFee(NameValuePair[] calldata)
        public
        virtual
        override
        nonReentrant
    {
        uint256 currentAccumulatedFeeCopy = currentAccumulatedFee;
        setClaimedFee(currentAccumulatedFeeCopy + getClaimedFee());
        setCurrentAccumulatedFee(0);
        emit FeeClaim(currentAccumulatedFeeCopy);
        depositToken.safeTransfer(feeReceiver, currentAccumulatedFeeCopy);
    }

    function getTotalDepositFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getDepositFee(params);
    }

    function getTotalWithdrawalFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getWithdrawalFee(params);
    }

    function getTotalPerformanceFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getPerformanceFee(params);
    }

    function getDepositToken() external view returns (IERC20Upgradeable) {
        return depositToken;
    }

    function getInvestmentToken() external view returns (IInvestmentToken) {
        return investmentToken;
    }

    function setInvestmentToken(IInvestmentToken investmentToken_)
        public
        virtual
        override
    {
        investmentToken = investmentToken_;
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

    function swapExactTokensForTokens(
        SwapService memory swapService_,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (swapService_.provider == SwapServiceProvider.TraderJoe) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(
                swapService_.router
            );

            IERC20Upgradeable(path[0]).approve(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            revert InvalidSwapServiceProvider();
        }
    }
}
