// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./PortfolioBaseUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract PortfolioOwnableBaseUpgradeable is
    OwnableUpgradeable,
    PortfolioBaseUpgradeable
{
    uint256[8] private futureFeaturesGap;

    // solhint-disable-next-line
    function __PortfolioOwnableBaseUpgradeable_init(
        PortfolioArgs calldata portfolioArgs
    ) internal onlyInitializing {
        __Ownable_init();
        __PortfolioBaseUpgradeable_init(portfolioArgs);
    }

    function addInvestable(
        IInvestable investable,
        uint24[] calldata newAllocations,
        NameValuePair[] calldata params
    ) public virtual override onlyOwner {
        super.addInvestable(investable, newAllocations, params);
    }

    function removeInvestable(
        IInvestable investable,
        uint24[] calldata newAllocations
    ) public virtual override onlyOwner {
        super.removeInvestable(investable, newAllocations);
    }

    function changeInvestable(
        IInvestable investable,
        NameValuePair[] calldata params
    ) public virtual override onlyOwner {
        super.changeInvestable(investable, params);
    }

    function setTargetInvestableAllocations(uint24[] calldata newAllocations)
        public
        virtual
        override
        onlyOwner
    {
        super.setTargetInvestableAllocations(newAllocations);
    }

    function rebalance(
        NameValuePair[][] calldata depositParams,
        NameValuePair[][] calldata withdrawParams
    ) public virtual override onlyOwner {
        super.rebalance(depositParams, withdrawParams);
    }

    function setDepositFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setDepositFee(fee_, params);
    }

    function setWithdrawalFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setWithdrawalFee(fee_, params);
    }

    function setPerformanceFee(uint24 fee_, NameValuePair[] calldata params)
        public
        virtual
        override
        onlyOwner
    {
        super.setPerformanceFee(fee_, params);
    }

    function setFeeReceiver(
        address feeReceiver_,
        NameValuePair[] calldata params
    ) public virtual override onlyOwner {
        super.setFeeReceiver(feeReceiver_, params);
    }

    function setInvestmentToken(IInvestmentToken investmentToken)
        public
        virtual
        override
        onlyOwner
    {
        super.setInvestmentToken(investmentToken);
    }

    function setTotalInvestmentLimit(uint256 totalInvestmentLimit)
        public
        virtual
        override
        onlyOwner
    {
        super.setTotalInvestmentLimit(totalInvestmentLimit);
    }

    function setInvestmentLimitPerAddress(uint256 investmentLimitPerAddress)
        public
        virtual
        override
        onlyOwner
    {
        super.setInvestmentLimitPerAddress(investmentLimitPerAddress);
    }
}
