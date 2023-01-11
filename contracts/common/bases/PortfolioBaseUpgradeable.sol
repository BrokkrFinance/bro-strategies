// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./FeeUpgradeable.sol";
import "./InvestmentLimitUpgradeable.sol";
import "../interfaces/IERC20UpgradeableExt.sol";
import "../interfaces/IInvestmentToken.sol";
import "../interfaces/IPortfolio.sol";
import "../libraries/InvestableLib.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";

struct PortfolioArgs {
    IInvestmentToken investmentToken;
    IERC20UpgradeableExt depositToken;
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
}

abstract contract PortfolioBaseUpgradeable is
    ContextUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    FeeUpgradeable,
    InvestmentLimitUpgradeable,
    IPortfolio
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IERC20UpgradeableExt;
    using SafeERC20Upgradeable for IInvestmentToken;
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;

    InvestableDesc[] private investableDescs;

    IInvestmentToken internal investmentToken;
    IERC20UpgradeableExt internal depositToken;
    uint256[20] private __gap;

    enum FeeType {
        Deposit,
        Withdrawal,
        Performance
    }

    // solhint-disable-next-line
    function __PortfolioBaseUpgradeable_init(
        PortfolioArgs calldata portfolioArgs
    ) internal onlyInitializing {
        __ReentrancyGuard_init();
        __ERC165_init();
        __Context_init();
        __FeeUpgradeable_init(
            portfolioArgs.depositFee,
            portfolioArgs.depositFeeParams,
            portfolioArgs.withdrawalFee,
            portfolioArgs.withdrawFeeParams,
            portfolioArgs.performanceFee,
            portfolioArgs.performanceFeeParams,
            portfolioArgs.feeReceiver,
            portfolioArgs.feeReceiverParams
        );
        __InvestmentLimitUpgradeable_init(
            portfolioArgs.totalInvestmentLimit,
            portfolioArgs.investmentLimitPerAddress
        );
        investmentToken = portfolioArgs.investmentToken;
        depositToken = portfolioArgs.depositToken;
    }

    function findInvestableDescInd(IInvestable investable)
        internal
        view
        returns (uint256)
    {
        for (uint256 i = 0; i < investableDescs.length; ++i)
            if (investableDescs[i].investable == investable) return i;
        return type(uint256).max;
    }

    function deconstructNameValuePairArray(
        NameValuePair[] calldata nameValueParams
    ) internal pure returns (string[] memory keys, string[] memory values) {
        uint256 paramsLength = nameValueParams.length;
        keys = new string[](paramsLength);
        values = new string[](paramsLength);
        for (uint256 i = 0; i < paramsLength; ++i) {
            keys[i] = nameValueParams[i].key;
            values[i] = nameValueParams[i].value;
        }
    }

    function containsInvestableDesc(IInvestable investable)
        internal
        view
        returns (bool)
    {
        return findInvestableDescInd(investable) != type(uint256).max;
    }

    function _addInvestable(
        IInvestable investable,
        uint24[] calldata newAllocations,
        NameValuePair[] calldata params
    ) internal virtual {
        if (containsInvestableDesc(investable)) revert InvestableAlreadyAdded();

        // workaround for 'Copying of type struct memory[] memory to storage not yet supported'
        (
            string[] memory keys,
            string[] memory values
        ) = deconstructNameValuePairArray(params);

        investableDescs.push(
            InvestableDesc(
                investable,
                newAllocations[newAllocations.length - 1],
                keys,
                values
            )
        );

        _setTargetInvestableAllocations(newAllocations);
        emit InvestableAdd(investable, newAllocations, params);
    }

    function _removeInvestable(
        IInvestable investable,
        uint24[] calldata newAllocations
    ) internal virtual {
        uint256 investableDescInd = findInvestableDescInd(investable);
        if (investableDescInd == type(uint256).max)
            revert InvestableNotYetAdded();
        InvestableDesc storage investableDesc = investableDescs[
            investableDescInd
        ];
        if (investableDesc.allocationPercentage != 0)
            revert InvestableHasNonZeroAllocation();
        investableDescs[investableDescInd] = investableDescs[
            investableDescs.length - 1
        ];
        investableDescs.pop();
        _setTargetInvestableAllocations(newAllocations);
        emit InvestableRemove(investable, newAllocations);
    }

    function _changeInvestable(
        IInvestable investable,
        NameValuePair[] calldata params
    ) internal virtual {
        uint256 investableDescInd = findInvestableDescInd(investable);
        if (investableDescInd == type(uint256).max)
            revert InvestableNotYetAdded();
        InvestableDesc storage investableDesc = investableDescs[
            investableDescInd
        ];
        (
            investableDesc.keys,
            investableDesc.values
        ) = deconstructNameValuePairArray(params);
        emit InvestableChange(investable, params);
    }

    function _setTargetInvestableAllocations(uint24[] calldata newAllocations)
        internal
        virtual
    {
        uint256 totalPercentage;
        uint256 investableDescsLength = investableDescs.length;
        uint256 newAllocationsLength = newAllocations.length;
        for (uint256 i = 0; i < newAllocationsLength; ++i)
            totalPercentage += newAllocations[i];

        if (totalPercentage != uint256(100) * Math.SHORT_FIXED_DECIMAL_FACTOR)
            revert RebalancePercentageNot100();
        if (investableDescsLength != newAllocationsLength)
            revert RebalanceIncorrectAllocationsLength();

        for (uint256 i = 0; i < investableDescsLength; i++) {
            investableDescs[i].allocationPercentage = newAllocations[i];
        }
        emit TargetInvestableAllocationsSet(newAllocations);
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
            interfaceId == type(IPortfolio).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function deposit(
        uint256 depositTokenAmountIn,
        uint256 minimumDepositTokenAmountOut,
        address investmentTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override nonReentrant {
        if (depositTokenAmountIn == 0) revert ZeroAmountDeposited();
        if (investmentTokenReceiver == address(0))
            revert ZeroInvestmentTokenReceiver();

        // check investment limits
        // the underlying defi protocols might take fees, but for limit check we can safely ignore it
        uint256 equityValuationBeforeInvestment = getEquityValuation(
            true,
            false
        );
        uint256 userEquity;
        uint256 investmentTokenSupply = getInvestmentTokenSupply();
        if (investmentTokenSupply != 0) {
            uint256 investmentTokenBalance = getInvestmentTokenBalanceOf(
                investmentTokenReceiver
            );
            userEquity =
                (equityValuationBeforeInvestment * investmentTokenBalance) /
                investmentTokenSupply;
        }
        checkTotalInvestmentLimit(
            depositTokenAmountIn,
            equityValuationBeforeInvestment
        );
        checkInvestmentLimitPerAddress(depositTokenAmountIn, userEquity);

        // transfering deposit tokens from the user
        depositToken.safeTransferFrom(
            _msgSender(),
            address(this),
            depositTokenAmountIn
        );

        // 1. emitting event for portfolios at the higher level first
        // 2. emitting the deposit amount versus the actual invested amount
        emit Deposit(
            _msgSender(),
            investmentTokenReceiver,
            depositTokenAmountIn
        );

        for (uint256 i = 0; i < investableDescs.length; i++) {
            uint256 embeddedAmount = (depositTokenAmountIn *
                investableDescs[i].allocationPercentage) /
                Math.SHORT_FIXED_DECIMAL_FACTOR /
                100;
            if (embeddedAmount == 0) continue;
            depositToken.approve(
                address(investableDescs[i].investable),
                embeddedAmount
            );
            investableDescs[i].investable.deposit(
                embeddedAmount,
                0,
                address(this),
                params
            );
        }

        // calculating the actual amount invested into the defi protocol
        uint256 equityValuationAfterInvestment = getEquityValuation(
            true,
            false
        );
        uint256 actualInvested = equityValuationAfterInvestment -
            equityValuationBeforeInvestment;
        if (actualInvested == 0) revert ZeroAmountInvested();
        if (actualInvested < minimumDepositTokenAmountOut)
            revert TooSmallDepositTokenAmountOut();

        // 1. Minting should be based on the actual amount invested versus the deposited amount
        //    to take defi fees and losses into consideration.
        // 2. Calling  depositToken.decimals() should be cached into a state variable, but that
        //    would require us to update all previous contracts.
        investmentToken.mint(
            investmentTokenReceiver,
            InvestableLib.calculateMintAmount(
                equityValuationBeforeInvestment,
                actualInvested,
                investmentTokenSupply,
                depositToken.decimals()
            )
        );
    }

    function withdraw(
        uint256 investmentTokenAmountIn,
        uint256 minimumDepositTokenAmountOut,
        address depositTokenReceiver,
        NameValuePair[] calldata params
    ) public virtual override nonReentrant {
        if (investmentTokenAmountIn == 0) revert ZeroAmountWithdrawn();
        if (depositTokenReceiver == address(0))
            revert ZeroDepositTokenReceiver();

        // transferring investment tokens from the caller
        uint256 withdrawnDepositTokenAmount = depositToken.balanceOf(
            address(this)
        );
        emit Withdrawal(
            _msgSender(),
            depositTokenReceiver,
            investmentTokenAmountIn
        );

        // withdrawing from underlying investables
        uint256 investmentTokenSupply = getInvestmentTokenSupply();
        for (uint256 i = 0; i < investableDescs.length; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            uint256 embeddedTokenAmountToBurn = (embeddedInvestable
                .getInvestmentTokenBalanceOf(address(this)) *
                investmentTokenAmountIn) / investmentTokenSupply;
            if (embeddedTokenAmountToBurn == 0) continue;
            embeddedInvestable.getInvestmentToken().approve(
                address(embeddedInvestable),
                embeddedTokenAmountToBurn
            );
            embeddedInvestable.withdraw(
                embeddedTokenAmountToBurn,
                0,
                address(this),
                params
            );
        }

        // checking whether enough deposit token was withdrawn
        withdrawnDepositTokenAmount =
            depositToken.balanceOf(address(this)) -
            withdrawnDepositTokenAmount;
        if (withdrawnDepositTokenAmount < minimumDepositTokenAmountOut)
            revert TooSmallDepositTokenAmountOut();

        // burning investment tokens
        investmentToken.burnFrom(_msgSender(), investmentTokenAmountIn);

        //transferring deposit tokens to the depositTokenReceiver
        depositToken.safeTransfer(
            depositTokenReceiver,
            withdrawnDepositTokenAmount
        );
    }

    // workaround for 'stack too deep' error
    struct RebalanceLocalVars {
        uint256 totalEquityBeforeRebalance;
        uint256 totalEquityAfterRebalance;
        uint256 withdrawnAmount;
        uint256 remainingAmount;
    }

    function getTotalEquity()
        internal
        view
        returns (
            uint256[] memory currentInvestableEquities,
            uint256 totalEquity
        )
    {
        uint256 investableDescsLength = investableDescs.length;
        currentInvestableEquities = new uint256[](investableDescs.length);
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            if (embeddedInvestable.getInvestmentTokenSupply() != 0) {
                currentInvestableEquities[i] =
                    (embeddedInvestable.getEquityValuation(false, false) *
                        embeddedInvestable.getInvestmentTokenBalanceOf(
                            address(this)
                        )) /
                    embeddedInvestable.getInvestmentTokenSupply();
                totalEquity += currentInvestableEquities[i];
            }
        }
    }

    function _rebalance(
        uint256 minimumDepositTokenAmountOut,
        NameValuePair[][] calldata depositParams,
        NameValuePair[][] calldata withdrawParams
    ) internal virtual nonReentrant {
        RebalanceLocalVars memory rebalanceLocalVars;

        // calculating current equity for investables
        uint256 investableDescsLength = investableDescs.length;
        uint256[] memory currentInvestableEquities;
        (
            currentInvestableEquities,
            rebalanceLocalVars.totalEquityBeforeRebalance
        ) = getTotalEquity();

        if (rebalanceLocalVars.totalEquityBeforeRebalance == 0) {
            return;
        }
        // calculating target equities for investables
        uint256[] memory targetInvestableEquities = new uint256[](
            investableDescsLength
        );
        for (uint256 i = 0; i < investableDescsLength; i++) {
            targetInvestableEquities[i] =
                (rebalanceLocalVars.totalEquityBeforeRebalance *
                    investableDescs[i].allocationPercentage) /
                Math.SHORT_FIXED_DECIMAL_FACTOR /
                100;
        }
        // withdrawing from investables that are above the target equity
        rebalanceLocalVars.withdrawnAmount = depositToken.balanceOf(
            address(this)
        );
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            if (currentInvestableEquities[i] > targetInvestableEquities[i]) {
                uint256 withdrawAmount = embeddedInvestable
                    .getInvestmentTokenBalanceOf(address(this)) -
                    (embeddedInvestable.getInvestmentTokenBalanceOf(
                        address(this)
                    ) * targetInvestableEquities[i]) /
                    currentInvestableEquities[i];
                embeddedInvestable.getInvestmentToken().approve(
                    address(embeddedInvestable),
                    withdrawAmount
                );
                embeddedInvestable.withdraw(
                    withdrawAmount,
                    0,
                    address(this),
                    withdrawParams[i]
                );
            }
        }
        rebalanceLocalVars.withdrawnAmount =
            depositToken.balanceOf(address(this)) -
            rebalanceLocalVars.withdrawnAmount;

        // depositing into investables that are below the target equity
        rebalanceLocalVars.remainingAmount = rebalanceLocalVars.withdrawnAmount;
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            if (currentInvestableEquities[i] < targetInvestableEquities[i]) {
                uint256 depositAmount = Math.min(
                    rebalanceLocalVars.remainingAmount,
                    targetInvestableEquities[i] - currentInvestableEquities[i]
                );

                if (depositAmount != 0) {
                    depositToken.approve(
                        address(embeddedInvestable),
                        depositAmount
                    );
                    embeddedInvestable.deposit(
                        depositAmount,
                        0,
                        address(this),
                        depositParams[i]
                    );
                } else break;
                rebalanceLocalVars.remainingAmount -= depositAmount;
            }
        }

        (
            currentInvestableEquities,
            rebalanceLocalVars.totalEquityAfterRebalance
        ) = getTotalEquity();

        if (
            rebalanceLocalVars.totalEquityAfterRebalance <
            minimumDepositTokenAmountOut
        ) revert TooSmallDepositTokenAmountOut();

        emit Rebalance();
    }

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory)
    {
        uint256 investableDescsLength = investableDescs.length;
        Balance[] memory assets = new Balance[](investableDescsLength);
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            IInvestmentToken embeddedInvestmentToken = embeddedInvestable
                .getInvestmentToken();
            assets[i] = Balance(
                address(embeddedInvestmentToken),
                embeddedInvestmentToken.balanceOf(address(this))
            );
        }
        return assets;
    }

    function getLiabilityBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory)
    {
        Balance[] memory liabilityBalances;
        return liabilityBalances;
    }

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (Valuation[] memory)
    {
        uint256 investableDescsLength = investableDescs.length;

        Valuation[] memory assetValuations = new Valuation[](
            investableDescsLength
        );

        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;

            assetValuations[i] = Valuation(
                address(embeddedInvestable),
                (embeddedInvestable.getInvestmentTokenSupply() == 0)
                    ? 0
                    : ((embeddedInvestable.getEquityValuation(
                        shouldMaximise,
                        shouldIncludeAmmPrice
                    ) *
                        embeddedInvestable.getInvestmentTokenBalanceOf(
                            address(this)
                        )) / embeddedInvestable.getInvestmentTokenSupply())
            );
        }
        return assetValuations;
    }

    function getLiabilityValuations(
        bool, /*shouldMaximise*/
        bool /*shouldIncludeAmmPrice*/
    ) public view virtual override returns (Valuation[] memory) {
        Valuation[] memory liabilityValuations;
        return liabilityValuations;
    }

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

        return equityValuation;
    }

    function getTotalDepositFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getEmbeddedDepositFee(params) + getDepositFee(params);
    }

    function getTotalWithdrawalFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getEmbeddedWithdrawalFee(params) + getWithdrawalFee(params);
    }

    function getTotalPerformanceFee(NameValuePair[] calldata params)
        external
        view
        virtual
        override
        returns (uint24)
    {
        return getEmbeddedPerformanceFee(params) + getPerformanceFee(params);
    }

    function getEmbeddedDepositFee(NameValuePair[] calldata params)
        internal
        view
        virtual
        returns (uint24)
    {
        return calculateEmbeddedFee(FeeType.Deposit, params);
    }

    function getEmbeddedWithdrawalFee(NameValuePair[] calldata params)
        internal
        view
        virtual
        returns (uint24)
    {
        uint256 embeddedFee;
        uint256 totalEquity;
        uint256 investableDescsLength = investableDescs.length;
        // calculating current equity for investables
        uint256[] memory currentInvestableEquities = new uint256[](
            investableDescs.length
        );
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            if (embeddedInvestable.getInvestmentTokenSupply() != 0) {
                currentInvestableEquities[i] =
                    (embeddedInvestable.getEquityValuation(false, false) *
                        embeddedInvestable.getInvestmentTokenBalanceOf(
                            address(this)
                        )) /
                    embeddedInvestable.getInvestmentTokenSupply();
                totalEquity += currentInvestableEquities[i];
            }
        }

        // no prior investment into any of the strategies by the portfolio
        if (totalEquity == 0) {
            return calculateEmbeddedFee(FeeType.Withdrawal, params);
        }
        // there is at least one strategy with investment by the portfolio
        else {
            for (uint256 i = 0; i < investableDescsLength; i++) {
                IInvestable embeddedInvestable = investableDescs[i].investable;
                embeddedFee +=
                    (uint256(embeddedInvestable.getTotalWithdrawalFee(params)) *
                        currentInvestableEquities[i]) /
                    totalEquity;
            }
            return uint24(embeddedFee);
        }
    }

    function getEmbeddedPerformanceFee(NameValuePair[] calldata params)
        internal
        view
        virtual
        returns (uint24)
    {
        return calculateEmbeddedFee(FeeType.Performance, params);
    }

    function calculateEmbeddedFee(
        FeeType feeType,
        NameValuePair[] calldata params
    ) internal view returns (uint24) {
        uint256 embeddedFee;
        uint256 investableDescsLength = investableDescs.length;
        for (uint256 i = 0; i < investableDescsLength; i++) {
            IInvestable embeddedInvestable = investableDescs[i].investable;
            embeddedFee +=
                uint256(
                    (feeType == FeeType.Deposit)
                        ? embeddedInvestable.getTotalDepositFee(params)
                        : (
                            (feeType == FeeType.Withdrawal)
                                ? embeddedInvestable.getTotalWithdrawalFee(
                                    params
                                )
                                : embeddedInvestable.getTotalPerformanceFee(
                                    params
                                )
                        )
                ) *
                investableDescs[i].allocationPercentage;
        }
        return uint24(embeddedFee / Math.SHORT_FIXED_DECIMAL_FACTOR / 100);
    }

    function getDepositToken()
        external
        view
        virtual
        override
        returns (IERC20Upgradeable)
    {
        return depositToken;
    }

    function _setInvestmentToken(IInvestmentToken investmentToken_)
        internal
        virtual
    {
        investmentToken = investmentToken_;
    }

    function getInvestmentToken()
        external
        view
        virtual
        override
        returns (IInvestmentToken)
    {
        return investmentToken;
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

    function claimFee(NameValuePair[] calldata params)
        public
        virtual
        override
        nonReentrant
    {}

    function getInvestables() external view returns (InvestableDesc[] memory) {
        return investableDescs;
    }
}
