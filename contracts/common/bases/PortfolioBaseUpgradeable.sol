//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./FeeUpgradeable.sol";
import "../Common.sol";
import "../InvestableLib.sol";
import "../InvestmentToken.sol";
import "../interfaces/IPortfolio.sol";
import "../interfaces/IInvestmentToken.sol";
import "../Math.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

abstract contract PortfolioBaseUpgradeable is
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    ContextUpgradeable,
    FeeUpgradeable,
    IPortfolio
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IInvestmentToken;
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;

    EnumerableMapUpgradeable.AddressToUintMap internal investableAllocations;

    IInvestmentToken public investmentToken;
    IERC20Upgradeable public depositToken;

    // solhint-disable-next-line
    function __PortfolioBaseUpgradeable_init(
        IInvestmentToken investmentToken_,
        IERC20Upgradeable depositToken_
    ) internal onlyInitializing {
        __ReentrancyGuard_init();
        __ERC165_init();
        __Context_init();
        __FeeOwnableUpgradeable_init(0, 0, 0);
        investmentToken = investmentToken_;
        depositToken = depositToken_;
    }

    function addInvestable(IInvestable investable) public virtual override {
        if (investableAllocations.contains(address(investable)))
            revert InvestableAlreadyAdded();
        investableAllocations.set(address(investable), 0);
        emit InvestableAdd(investable);
    }

    function removeInvestable(IInvestable investable) public virtual override {
        if (!investableAllocations.contains(address(investable)))
            revert InvestableNotYetAdded();
        if (investableAllocations.get(address(investable)) != 0)
            revert InvestableHasNonZeroAllocation();
        investableAllocations.remove(address(investable));
        emit InvestableRemove(investable);
    }

    function getTargetInvestableAllocations()
        external
        view
        virtual
        override
        returns (InvestableAllocation[] memory)
    {
        InvestableAllocation[]
            memory investableAllocationsReturn = new InvestableAllocation[](
                investableAllocations.length()
            );
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (
                address investableAddr,
                uint256 allocationPct
            ) = investableAllocations.at(i);
            investableAllocationsReturn[i] = InvestableAllocation(
                IInvestable(investableAddr),
                uint24(allocationPct)
            );
        }
        return investableAllocationsReturn;
    }

    function setTargetInvestableAllocations(uint256[] calldata newAllocations)
        public
        virtual
        override
    {
        uint256 totalPct;
        for (uint256 i = 0; i < newAllocations.length; ++i) {
            totalPct += newAllocations[i];
        }
        if (totalPct != uint256(100) * Math.SHORT_FIXED_DECIMAL_POINTS)
            revert RebalancePctNot100();
        if (investableAllocations.length() != newAllocations.length)
            revert RebalanceIncorrectAllocationsLength();
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            investableAllocations.set(investableAddr, newAllocations[i]);
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
            interfaceId == type(IPortfolio).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function deposit(uint256 amount, NameValuePair[] memory params)
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

        emit Deposit(_msgSender(), amount);
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (
                address investableAddr,
                uint256 allocationPct
            ) = investableAllocations.at(i);

            uint256 embeddedAmount = (amount * allocationPct) /
                Math.SHORT_FIXED_DECIMAL_POINTS /
                100;
            if (embeddedAmount == 0) continue;

            IInvestable embeddedInvestable = IInvestable(investableAddr);
            depositToken.safeApprove(
                address(embeddedInvestable),
                embeddedAmount
            );
            embeddedInvestable.deposit(embeddedAmount, params);
        }
    }

    function withdraw(uint256 amount, NameValuePair[] memory params)
        external
        virtual
        override
        nonReentrant
    {
        if (amount == 0) revert ZeroAmountWithdrawn();

        uint256 investmentTokenSupply = getInvestmentTokenSupply();
        investmentToken.burnFrom(_msgSender(), amount);

        uint256 withdrewAmount = depositToken.balanceOf(address(this));
        emit Withdrawal(_msgSender(), amount);
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);

            IInvestable embeddedInvestable = IInvestable(investableAddr);
            uint256 embeddedTokenAmountToBurn = (embeddedInvestable
                .getInvestmentTokenBalanceOf(address(this)) * amount) /
                investmentTokenSupply;
            if (embeddedTokenAmountToBurn == 0) continue;

            embeddedInvestable.getInvestmentToken().safeApprove(
                address(embeddedInvestable),
                embeddedTokenAmountToBurn
            );
            embeddedInvestable.withdraw(embeddedTokenAmountToBurn, params);
        }
        withdrewAmount = depositToken.balanceOf(address(this)) - withdrewAmount;

        depositToken.safeTransfer(_msgSender(), withdrewAmount);
    }

    struct RebalanceLocalVars {
        uint256 totalAum;
        uint256 withdrawnAmount;
        uint256 remainingAmount;
    }

    function rebalance(
        NameValuePair[][] calldata depositParams,
        NameValuePair[][] calldata withdrawParams
    ) public virtual override nonReentrant {
        RebalanceLocalVars memory rebalanceLocalVars;

        // calculating current AUM for investables
        uint256[] memory currentInvestableAums = new uint256[](
            investableAllocations.length()
        );
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            if (embeddedInvestable.getInvestmentTokenSupply() != 0) {
                currentInvestableAums[i] =
                    (embeddedInvestable.getTotalAUM(false, false) *
                        embeddedInvestable.getInvestmentTokenBalanceOf(
                            address(this)
                        )) /
                    embeddedInvestable.getInvestmentTokenSupply();
                rebalanceLocalVars.totalAum += currentInvestableAums[i];
            }
        }

        if (rebalanceLocalVars.totalAum == 0) {
            return;
        }

        // calculating target AUM for investables
        uint256[] memory targetInvestableAums = new uint256[](
            investableAllocations.length()
        );
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (, uint256 targetAllocation) = investableAllocations.at(i);
            targetInvestableAums[i] =
                (rebalanceLocalVars.totalAum * targetAllocation) /
                Math.SHORT_FIXED_DECIMAL_POINTS /
                100;
        }

        // withdrawing from investables that are above the target AUM
        rebalanceLocalVars.withdrawnAmount = depositToken.balanceOf(
            address(this)
        );
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            if (currentInvestableAums[i] > targetInvestableAums[i]) {
                uint256 withdrawAmount = embeddedInvestable
                    .getInvestmentTokenBalanceOf(address(this)) -
                    (embeddedInvestable.getInvestmentTokenBalanceOf(
                        address(this)
                    ) * targetInvestableAums[i]) /
                    currentInvestableAums[i];
                embeddedInvestable.getInvestmentToken().safeApprove(
                    investableAddr,
                    withdrawAmount
                );
                embeddedInvestable.withdraw(withdrawAmount, withdrawParams[i]);
            }
        }
        rebalanceLocalVars.withdrawnAmount =
            depositToken.balanceOf(address(this)) -
            rebalanceLocalVars.withdrawnAmount;

        // depositing into investables that are below the target AUM
        rebalanceLocalVars.remainingAmount = rebalanceLocalVars.withdrawnAmount;
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            if (currentInvestableAums[i] < targetInvestableAums[i]) {
                uint256 depositAmount = Math.min(
                    rebalanceLocalVars.remainingAmount,
                    targetInvestableAums[i] - currentInvestableAums[i]
                );
                if (depositAmount != 0) {
                    depositToken.approve(investableAddr, depositAmount);
                    embeddedInvestable.deposit(depositAmount, depositParams[i]);
                } else break;
                rebalanceLocalVars.remainingAmount -= depositAmount;
            }
        }
        emit Rebalance();
    }

    function getTotalAUM(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (uint256 aum)
    {
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            if (embeddedInvestable.getInvestmentTokenSupply() != 0)
                aum +=
                    (embeddedInvestable.getTotalAUM(
                        shouldMaximise,
                        shouldIncludeAmmPrice
                    ) *
                        embeddedInvestable.getInvestmentTokenBalanceOf(
                            address(this)
                        )) /
                    embeddedInvestable.getInvestmentTokenSupply();
        }
    }

    function getAssets() external view returns (Asset[] memory) {
        Asset[] memory assets = new Asset[](investableAllocations.length());
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (address investableAddr, ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            IInvestmentToken embeddedInvestmentToken = embeddedInvestable
                .getInvestmentToken();
            assets[i] = Asset(
                address(embeddedInvestmentToken),
                embeddedInvestmentToken.balanceOf(address(this))
            );
        }
        return assets;
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
        external
        view
        virtual
        override
        returns (uint256)
    {
        return investmentToken.balanceOf(account);
    }

    function getEmbeddedDepositFee() internal returns (uint24) {
        uint256 embeddedFee;
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (
                address investableAddr,
                uint256 allocationPct
            ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            embeddedFee += embeddedInvestable.getDepositFee() * allocationPct;
        }
        return depositFee + uint24(embeddedFee / 100);
    }

    function getEmbeddedWithdrawalFee() internal returns (uint24) {
        uint256 embeddedFee;
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (
                address investableAddr,
                uint256 allocationPct
            ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            embeddedFee +=
                embeddedInvestable.getWithdrawalFee() *
                allocationPct;
        }
        return withdrawalFee + uint24(embeddedFee / 100);
    }

    function getEmbeddedPerformanceFee() internal returns (uint24) {
        uint256 embeddedDepositFee;
        for (uint256 i = 0; i < investableAllocations.length(); i++) {
            (
                address investableAddr,
                uint256 allocationPct
            ) = investableAllocations.at(i);
            IInvestable embeddedInvestable = IInvestable(investableAddr);
            embeddedDepositFee +=
                embeddedInvestable.getPerformanceFee() *
                allocationPct;
        }
        return performanceFee + uint24(embeddedDepositFee / 100);
    }

    function claimFee() public virtual override nonReentrant {}
}
