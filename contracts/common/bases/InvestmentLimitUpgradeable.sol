//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/IInvestable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract InvestmentLimitUpgradeable is Initializable, IInvestable {
    error TotalInvestmentLimitExceeded();
    error InvestmentLimitPerAddressExceeded();

    uint256 private totalInvestmentLimit;
    uint256 private investmentLimitPerAddress;
    uint256[8] private futureFeaturesGap;

    // solhint-disable-next-line func-name-mixedcase
    function __InvestmentLimitUpgradeable_init(
        uint256 totalInvestmentLimit_,
        uint256 investmentLimitPerAddress_
    ) internal onlyInitializing {
        setTotalInvestmentLimit(totalInvestmentLimit_);
        setInvestmentLimitPerAddress(investmentLimitPerAddress_);
    }

    function getTotalInvestmentLimit()
        external
        view
        virtual
        override
        returns (uint256)
    {
        return totalInvestmentLimit;
    }

    function setTotalInvestmentLimit(uint256 totalInvestmentLimit_)
        public
        virtual
        override
    {
        totalInvestmentLimit = totalInvestmentLimit_;
    }

    function getInvestmentLimitPerAddress()
        external
        view
        virtual
        override
        returns (uint256)
    {
        return investmentLimitPerAddress;
    }

    function setInvestmentLimitPerAddress(uint256 investmentLimitPerAddress_)
        public
        virtual
        override
    {
        investmentLimitPerAddress = investmentLimitPerAddress_;
    }

    function checkTotalInvestmentLimit(
        uint256 aboutToInvest,
        uint256 totalInvestedSoFar
    ) internal virtual {
        if (aboutToInvest + totalInvestedSoFar > totalInvestmentLimit)
            revert TotalInvestmentLimitExceeded();
    }

    function checkInvestmentLimitPerAddress(
        uint256 aboutToInvest,
        uint256 investedSoFarPerAddress
    ) internal virtual {
        if (aboutToInvest + investedSoFarPerAddress > investmentLimitPerAddress)
            revert InvestmentLimitPerAddressExceeded();
    }
}
